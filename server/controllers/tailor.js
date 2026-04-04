import MasterExperience from '../models/MasterExperience.js';
import TailoringSession from '../models/TailoringSession.js';
import User from '../models/User.js';
import * as kimiService from '../services/kimiService.js';
import * as latexBuilder from '../services/latexBuilder.js';
import * as pdfService from '../services/pdfService.js';
import { createError } from '../middleware/errorHandler.js';
import { tailorSkills } from '../utils/skillsTailoring.js';

/**
 * Generate a tailored resume
 * POST /api/tailor
 */
export const generateResume = async (req, res, next) => {
  try {
    const { jobTitle, company, jobDescriptionRaw, mode = 'pdf' } = req.body;
    const userId = req.user._id;

    // Truncate job description if too long
    const jdTruncated = jobDescriptionRaw.slice(0, 20000);

    // Fetch all visible experiences for user
    const experiences = await MasterExperience.find({
      userId,
      visible: true,
    }).sort({ priority: 1 });

    if (experiences.length === 0) {
      throw createError(400, 'no_experiences', 'You have no visible experience entries. Add some in your profile first.');
    }

    const debug = process.env.NODE_ENV !== 'production';
    if (debug) {
      console.log(`Starting tailor for user ${userId}`);
      console.log(`Found ${experiences.length} experiences in vault:`, experiences.map(e => `${e.type}: ${e.title}`));
    }

    // Stage 1: Extract keywords from job description
    if (debug) console.log('Stage 1: Extracting keywords from job description...');
    let extractedKeywords;
    try {
      extractedKeywords = await kimiService.extractKeywords(jdTruncated);
    } catch (error) {
      if (error.name === 'KimiAPIError' || error.name === 'KimiParseError') {
        throw createError(502, 'llm_api_error', `AI service error: ${error.message}`);
      }
      throw error;
    }
    if (debug) console.log('Keywords extracted:', JSON.stringify(extractedKeywords, null, 2));

    // Stage 2: Select relevant experiences
    if (debug) console.log('Stage 2: Selecting relevant experiences from vault...');
    let selectedIds;
    try {
      selectedIds = await kimiService.selectExperiences(extractedKeywords, experiences, jdTruncated);
    } catch (error) {
      if (error.name === 'KimiAPIError' || error.name === 'KimiParseError') {
        throw createError(502, 'llm_api_error', `AI service error: ${error.message}`);
      }
      throw error;
    }
    if (debug) console.log(`Selected ${selectedIds.length} experience IDs:`, selectedIds);

    // Fetch full documents for selected experiences
    const selectedExperiences = experiences.filter(exp => 
      selectedIds.includes(exp._id.toString())
    );
    if (debug) console.log('Selected experiences:', selectedExperiences.map(e => `${e.type}: ${e.title}`));

    // Stage 3: Rewrite bullets for work/project entries
    if (debug) console.log('Stage 3: Rewriting bullets based on job keywords...');
    let rewrittenMap;
    try {
      rewrittenMap = await kimiService.rewriteBullets(selectedExperiences, extractedKeywords, jdTruncated);
      if (debug) console.log('Rewritten bullets map:', JSON.stringify(rewrittenMap, null, 2));
    } catch (error) {
      if (error.name === 'KimiAPIError' || error.name === 'KimiParseError') {
        // Fall back to original bullets
        console.warn('Bullet rewriting failed, using originals:', error.message);
        rewrittenMap = {};
      }
    }

    // Fetch user for resume header
    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, 'user_not_found', 'User account not found. Please log in again.');
    }

    // Stage 4: Tailor skills by JD relevance (programmatic, no LLM call)
    const skillEntries = selectedExperiences.filter(e => e.type === 'skill');
    const tailoredSkillEntries = tailorSkills(skillEntries, extractedKeywords);
    if (debug) console.log('Skills tailored — categories reordered by JD relevance');

    // Build LaTeX document
    if (debug) console.log('Building LaTeX document...');
    const latexString = latexBuilder.build(
      selectedExperiences,
      rewrittenMap,
      { jobTitle, company },
      user,
      extractedKeywords,
      tailoredSkillEntries
    );
    
    if (debug) console.log('Generated LaTeX (first 2000 chars):', latexString.substring(0, 2000));

    // Always return LaTeX in response (for Copy LaTeX feature)
    const responseData = {
      sessionId: null,
      latex: latexString,
      selectedExperienceIds: selectedIds,
      extractedKeywords,
    };

    // If preview mode, skip PDF compilation
    if (mode === 'preview' || mode === 'latex') {
      // Save session without PDF
      const session = new TailoringSession({
        userId,
        jobTitle,
        company,
        jobDescriptionRaw: jdTruncated,
        extractedKeywords,
        selectedExperienceIds: selectedIds,
        generatedLatex: latexString,
        status: 'draft',
      });
      await session.save();
      
      responseData.sessionId = session._id;
      return res.json(responseData);
    }

    // Compile PDF
    if (debug) console.log('Compiling PDF...');
    let pdfBuffer;
    try {
      pdfBuffer = await pdfService.compile(latexString);
    } catch (error) {
      // Save session even on compile failure for debugging
      const session = new TailoringSession({
        userId,
        jobTitle,
        company,
        jobDescriptionRaw: jdTruncated,
        extractedKeywords,
        selectedExperienceIds: selectedIds,
        generatedLatex: latexString,
        status: 'draft',
      });
      await session.save();

      if (error.code === 'latex_compile_error') {
        error.status = 422;
        error.sessionId = session._id;
      }
      throw error;
    }

    // Save PDF if storage is configured
    const pdfPath = await pdfService.savePdf(pdfBuffer, `session_${Date.now()}`);

    // Save session
    const session = new TailoringSession({
      userId,
      jobTitle,
      company,
      jobDescriptionRaw: jdTruncated,
      extractedKeywords,
      selectedExperienceIds: selectedIds,
      generatedLatex: latexString,
      pdfStoragePath: pdfPath,
      status: 'verified',
    });
    await session.save();

    if (debug) console.log(`Tailor complete. Session: ${session._id}`);

    // Return JSON with PDF as base64 (so frontend can also get latex)
    if (mode === 'json') {
      return res.json({
        ...responseData,
        sessionId: session._id,
        pdfBase64: pdfBuffer.toString('base64'),
      });
    }

    // PDF mode (default) - stream the PDF
    const safeName = [company, jobTitle]
      .filter(Boolean)
      .join('_')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const filename = safeName ? `resume_${safeName}.pdf` : 'resume.pdf';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'X-Session-Id': session._id.toString(),
      'X-Latex-Available': 'true',
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Download PDF for a past session
 * GET /api/tailor/:sessionId/pdf
 */
export const downloadPdf = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await TailoringSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw createError(404, 'not_found', 'Session not found');
    }

    let pdfBuffer;

    // Try to read from storage first
    if (session.pdfStoragePath) {
      pdfBuffer = await pdfService.readPdf(session.pdfStoragePath);
    }

    // Recompile if not in storage
    if (!pdfBuffer && session.generatedLatex) {
      try {
        pdfBuffer = await pdfService.compile(session.generatedLatex);
      } catch (error) {
        if (error.code === 'latex_compile_error') {
          error.status = 422;
        }
        throw error;
      }
    }

    if (!pdfBuffer) {
      throw createError(404, 'not_found', 'PDF not available for this session');
    }

    const safeName = [session.company, session.jobTitle]
      .filter(Boolean)
      .join('_')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const filename = safeName ? `resume_${safeName}.pdf` : 'resume.pdf';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Get session details
 * GET /api/tailor/:sessionId
 */
export const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await TailoringSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw createError(404, 'not_found', 'Session not found');
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * List all sessions for current user
 * GET /api/sessions
 */
export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const [sessions, total] = await Promise.all([
      TailoringSession.find({ userId })
        .select('-generatedLatex') // Exclude large field
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      TailoringSession.countDocuments({ userId }),
    ]);

    res.json({
      sessions,
      total,
    });
  } catch (error) {
    next(error);
  }
};

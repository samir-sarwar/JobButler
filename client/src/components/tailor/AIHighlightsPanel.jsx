import SectionHeader from '../ui/SectionHeader';
import MatchCard from './MatchCard';

export default function AIHighlightsPanel({ highlights, isLoading }) {
  return (
    <div>
      <SectionHeader title="AI Selected Highlights" icon="auto_awesome" />

      {highlights.length > 0 ? (
        <>
          {highlights.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
          {isLoading && (
            <p className="font-body text-xs italic text-on-surface-variant mt-3">
              Scanning vault for additional relevant intersection fragments...
            </p>
          )}
        </>
      ) : (
        <div className="py-8 text-center">
          <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">search</span>
          <p className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
            Paste a job description and generate to see matches
          </p>
        </div>
      )}
    </div>
  );
}

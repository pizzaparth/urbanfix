import { useState, useMemo, useRef, useCallback } from 'react';
import { HEATMAP_LEVEL_COLORS, getHeatmapLevel } from '../config/chartTheme.js';

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CELL_SIZE = 11;
const CELL_GAP = 2;
const CELL_STRIDE = CELL_SIZE + CELL_GAP;

const ActivityHeatmap = ({ activity = [], maxCount = 0 }) => {
  const [hovered, setHovered] = useState(null);
  // Positioning anchor for the tooltip must be a non-scrolling ancestor —
  // `.heatmap-scroll` sets overflow-x, which makes overflow-y compute to
  // `auto` too (a CSS quirk: an unspecified axis paired with a non-visible
  // axis is never left as `visible`), silently clipping a tooltip positioned
  // above a cell near the top of the scrollable area.
  const containerRef = useRef(null);

  // Depends only on activity/maxCount — hovering a cell must never re-walk
  // or re-bucket the ~365-entry array on every hover-driven re-render.
  const { cells, columns, monthLabels } = useMemo(() => {
    if (!activity.length) return { cells: [], columns: 0, monthLabels: [] };

    const firstDay = new Date(`${activity[0].date}T00:00:00Z`);
    const leadingPad = firstDay.getUTCDay(); // Sunday-first grid

    const padded = [
      ...Array.from({ length: leadingPad }, () => null),
      ...activity.map((day) => ({
        ...day,
        level: getHeatmapLevel(day.count, maxCount),
      })),
    ];

    const cols = Math.ceil(padded.length / 7);
    const trailingPad = cols * 7 - padded.length;
    const fullyPadded = [...padded, ...Array.from({ length: trailingPad }, () => null)];

    const labels = [];
    let lastMonth = -1;
    for (let col = 0; col < cols; col += 1) {
      const anchor = fullyPadded.slice(col * 7, col * 7 + 7).find(Boolean);
      if (!anchor) continue;
      const d = new Date(`${anchor.date}T00:00:00Z`);
      const month = d.getUTCMonth();
      const isFirstOfMonth = d.getUTCDate() <= 7 && month !== lastMonth;
      if (isFirstOfMonth) {
        labels.push({ column: col, label: MONTH_ABBR[month] });
        lastMonth = month;
      }
    }

    return { cells: fullyPadded, columns: cols, monthLabels: labels };
  }, [activity, maxCount]);

  const handleEnter = useCallback((event, day) => {
    if (!day || !containerRef.current) return;
    const cellRect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setHovered({
      day,
      left: cellRect.left - containerRect.left + cellRect.width / 2,
      top: cellRect.top - containerRect.top,
    });
  }, []);

  const handleLeave = useCallback(() => setHovered(null), []);

  if (!columns) return null;

  return (
    <div className="heatmap-container" ref={containerRef}>
      <div className="heatmap-scroll">
        <div className="heatmap-grid-wrap" onMouseLeave={handleLeave}>
          <div className="heatmap-months" style={{ width: columns * CELL_STRIDE }}>
            {monthLabels.map(({ column, label }) => (
              <span key={`${column}-${label}`} className="heatmap-month-label" style={{ left: column * CELL_STRIDE }}>
                {label}
              </span>
            ))}
          </div>

          <div className="heatmap-body">
            <div className="heatmap-weekday-labels">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="text-mono-label heatmap-weekday-label">{label}</span>
              ))}
            </div>

            <div
              className="heatmap-grid"
              style={{ gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`, gridAutoColumns: `${CELL_SIZE}px` }}
            >
              {cells.map((day, i) => (
                day ? (
                  <div
                    key={day.date}
                    className="heatmap-cell"
                    style={{ backgroundColor: HEATMAP_LEVEL_COLORS[day.level] }}
                    onMouseEnter={(e) => handleEnter(e, day)}
                    onMouseLeave={handleLeave}
                  />
                ) : (
                  <div key={`pad-${i}`} className="heatmap-cell heatmap-cell--pad" />
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      {hovered && (
        <div className="heatmap-tooltip" style={{ left: hovered.left, top: hovered.top }}>
          <div className="text-mono" style={{ fontWeight: 600 }}>
            {hovered.day.count} {hovered.day.count === 1 ? 'event' : 'events'}
          </div>
          <div className="text-mono-label">
            {new Date(`${hovered.day.date}T00:00:00Z`).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
            })}
          </div>
          <div className="text-small text-secondary">
            {hovered.day.filedCount} filed · {hovered.day.resolvedCount} resolved
          </div>
        </div>
      )}

      <div className="heatmap-legend">
        <span className="text-mono-label">Less</span>
        {HEATMAP_LEVEL_COLORS.map((color, i) => (
          <span key={i} className="heatmap-legend-swatch" style={{ backgroundColor: color }} />
        ))}
        <span className="text-mono-label">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;

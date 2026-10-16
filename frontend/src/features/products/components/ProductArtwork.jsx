const illustratedProductIds = ['tiramisu', 'strawberry', 'macaron', 'croissant', 'cheesecake', 'choux', 'cookie', 'latte']

export function ProductArtwork({ id, name, background, imageUrl = '', compact = false, className = '' }) {
  const size = compact ? 'h-14 w-14' : 'h-32 w-full sm:h-36'
  const illustrationSize = compact ? 'h-11 w-11' : 'h-[86%] w-[86%] max-w-[220px]'

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${background} ${className || size}`}>
      {!compact && (
        <>
          <span className="absolute -right-8 -top-12 h-36 w-36 rounded-full border border-white/35" />
          <span className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full border border-white/30" />
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#493125]/10 to-transparent" />
        </>
      )}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={(event) => event.currentTarget.remove()}
          className="absolute inset-0 z-10 h-full w-full object-cover"
        />
      )}
      <svg
        className={`relative drop-shadow-[0_9px_8px_rgba(65,40,28,0.2)] transition-transform duration-300 group-hover:scale-[1.06] ${illustrationSize}`}
        viewBox="0 0 180 130"
        role="img"
        aria-label={`Minh họa ${name}`}
      >
        {id === 'tiramisu' && (
          <>
            <ellipse cx="90" cy="107" rx="56" ry="9" fill="#694a3b" opacity=".2" />
            <path d="M42 56h96l-8 42H50z" fill="#f3dfc8" />
            <path d="M46 63h88l-3 13H49z" fill="#573b30" />
            <path d="M49 79h82l-3 12H52z" fill="#e9c9a7" />
            <path d="M52 92h76l-2 6H54z" fill="#624333" />
            <path d="M42 53c0-8 21-14 48-14s48 6 48 14-21 13-48 13-48-5-48-13Z" fill="#f2dfc7" />
            <path d="M48 51c5-7 21-11 42-11 23 0 39 5 44 11-8 4-25 6-44 6-20 0-35-2-42-6Z" fill="#624333" />
            <path d="m67 44 3-5m9 6 2-6m11 5 3-6m9 7 3-5m8 8 3-5" stroke="#d2ae86" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {id === 'strawberry' && (
          <>
            <ellipse cx="90" cy="108" rx="59" ry="9" fill="#694a3b" opacity=".19" />
            <path d="M39 64h102l-8 34H47z" fill="#f8eee0" />
            <path d="M46 82h88l-3 13H49z" fill="#d19a79" />
            <path d="M38 61c0-7 23-12 52-12s52 5 52 12-23 12-52 12-52-5-52-12Z" fill="#fff4e6" />
            <path d="M49 54c4-11 17-18 41-18 23 0 37 7 42 18" fill="none" stroke="#b96f69" strokeWidth="5" strokeLinecap="round" />
            <path d="M55 50c5-8 17-13 35-13 20 0 33 5 39 13" fill="none" stroke="#fff4e6" strokeWidth="7" strokeLinecap="round" />
            <path d="M69 39c-3-10 3-16 10-13 4-8 13-5 12 3 9-1 11 7 6 12-8 6-23 6-28-2Z" fill="#b74745" />
            <path d="m81 29 1-5m7 7 4-4m-1 11 5 1m-14 1-3 4" stroke="#68804f" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {id === 'macaron' && (
          <>
            <ellipse cx="91" cy="107" rx="43" ry="8" fill="#694a3b" opacity=".18" />
            <g transform="rotate(-8 90 78)">
              <path d="M49 80c0-12 17-19 40-19s40 7 40 19c0 7-13 11-40 11S49 87 49 80Z" fill="#9c6258" />
              <path d="M50 74c0-11 16-18 39-18s39 7 39 18-16 16-39 16-39-5-39-16Z" fill="#d9aaa0" />
              <path d="M55 72c8 5 22 7 34 7 14 0 27-2 34-7" fill="none" stroke="#fff0dc" strokeWidth="5" strokeLinecap="round" />
              <path d="M55 67c6-9 20-14 34-14s27 5 34 14" fill="#f0d1c7" />
              <path d="M55 64c8 4 20 6 34 6s26-2 34-6" fill="none" stroke="#fff0dc" strokeWidth="4" strokeLinecap="round" />
            </g>
            <g transform="rotate(8 91 46)">
              <path d="M61 46c0-9 13-15 30-15s30 6 30 15c0 6-10 9-30 9s-30-3-30-9Z" fill="#ad7564" />
              <path d="M61 42c0-9 13-15 30-15s30 6 30 15-13 12-30 12-30-3-30-12Z" fill="#ebc8b7" />
              <path d="M68 41c6 3 14 4 23 4s17-1 23-4" fill="none" stroke="#fff2df" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </>
        )}
        {id === 'croissant' && (
          <>
            <ellipse cx="90" cy="101" rx="57" ry="9" fill="#694a3b" opacity=".2" />
            <path d="M35 84c7-20 21-37 41-43-5 12-1 22 8 28-12 4-22 12-30 25-8 1-15-3-19-10Z" fill="#a86d34" />
            <path d="M145 84c-7-20-21-37-41-43 5 12 1 22-8 28 12 4 22 12 30 25 8 1 15-3 19-10Z" fill="#a86d34" />
            <path d="M40 79c11-20 28-32 50-34-8 13-8 24 0 34-15 2-27 8-36 19-7-2-12-8-14-19Z" fill="#d89b4e" />
            <path d="M140 79c-11-20-28-32-50-34 8 13 8 24 0 34 15 2 27 8 36 19 7-2 12-8 14-19Z" fill="#d89b4e" />
            <path d="M57 76c12-16 23-24 33-27-6 13-5 25 0 37-12 1-21 5-29 12-4-5-5-13-4-22Z" fill="#efbd69" />
            <path d="M123 76c-12-16-23-24-33-27 6 13 5 25 0 37 12 1 21 5 29 12 4-5 5-13 4-22Z" fill="#efbd69" />
            <path d="M54 78c8 2 13 0 18-5m54 5c-8 2-13 0-18-5M72 60c2 6 5 10 10 13m26-13c-2 6-5 10-10 13" fill="none" stroke="#f7d58b" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {id === 'cheesecake' && (
          <>
            <ellipse cx="91" cy="103" rx="54" ry="8" fill="#694a3b" opacity=".18" />
            <path d="m48 83 56-43 32 48-59 14Z" fill="#e5c989" />
            <path d="m50 78 54-37 29 43-57 13Z" fill="#f4e7c4" />
            <path d="m50 78 54-37 8 13-54 37Z" fill="#fff1d1" />
            <path d="m56 80 48-33" stroke="#d9bd7b" strokeWidth="3" strokeLinecap="round" />
            <path d="m61 87 48-33" stroke="#fff9e7" strokeWidth="2" strokeLinecap="round" />
            <circle cx="123" cy="49" r="13" fill="#e7c85e" />
            <circle cx="123" cy="49" r="9" fill="#f6e69b" />
            <path d="M123 41v16m-8-8h16m-13-6 11 12m0-12-11 12" stroke="#d4ae42" strokeWidth="1.5" />
          </>
        )}
        {id === 'choux' && (
          <>
            <ellipse cx="90" cy="103" rx="48" ry="8" fill="#694a3b" opacity=".18" />
            <path d="M45 80c-7-14 2-26 17-25 4-16 27-20 34-6 13-10 31-2 28 13 16 4 18 23 3 30-22 11-66 8-82-1-5-3-7-6-7-11Z" fill="#d6a263" />
            <path d="M48 77c5-10 15-14 26-11 7-13 22-15 28-4 11-8 24-2 24 8 11 3 13 13 3 18-19 8-60 7-76-1-5-3-7-6-5-10Z" fill="#f0ce98" />
            <path d="M62 68c7-5 14-4 19 0m17-5c7-3 14 0 17 5m-28 3 8 4m14 1 7-3m-41 6 7 2" fill="none" stroke="#fff0d6" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {id === 'cookie' && (
          <>
            <ellipse cx="91" cy="103" rx="48" ry="8" fill="#694a3b" opacity=".18" />
            <path d="M57 43c8-8 18-5 23-1 8-7 18-3 21 3 11-2 18 6 16 14 9 7 7 17 0 22 1 11-8 18-18 16-8 8-19 6-25 0-12 3-21-4-21-14-11-5-12-17-4-25-2-6 1-12 8-15Z" fill="#8f5d42" />
            <path d="M59 52c8-6 17-2 20 3 7-5 16-3 19 4 8-2 13 5 11 11 7 6 3 14-4 16-1 8-9 12-16 8-8 5-16 1-18-6-8 1-14-5-12-12-8-4-7-14 0-18-2-2-1-5 0-6Z" fill="#bd8154" />
            <g fill="#57382b"><circle cx="76" cy="56" r="4" /><circle cx="99" cy="53" r="3.5" /><circle cx="108" cy="72" r="4" /><circle cx="82" cy="82" r="4" /><circle cx="64" cy="68" r="3" /><circle cx="94" cy="92" r="3" /></g>
            <path d="M65 49c4-2 8-2 11 1m25 19 5 2" stroke="#e3aa71" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {id === 'latte' && (
          <>
            <ellipse cx="88" cy="104" rx="48" ry="8" fill="#694a3b" opacity=".19" />
            <path d="M48 60h70l-8 39H56z" fill="#fff5e7" />
            <path d="M118 68h10c12 0 13 20 0 22h-14" fill="none" stroke="#fff5e7" strokeWidth="7" strokeLinecap="round" />
            <path d="M55 76h56l-4 19H59z" fill="#936345" />
            <path d="M50 60c0-8 15-14 33-14s35 6 35 14-16 12-35 12-33-4-33-12Z" fill="#f8ebd8" />
            <path d="M61 60c0-5 10-9 22-9s23 4 23 9-10 8-23 8-22-3-22-8Z" fill="#d9b89a" />
            <path d="M77 59c3-5 10-6 13-2 6-3 11 2 8 6-4 5-17 6-21 2-2-2-2-4 0-6Z" fill="#f5e7d4" />
            <path d="M61 39c4-5 10-5 14-1m8-4 3-6" stroke="#fff8ed" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {!illustratedProductIds.includes(id) && (
          <>
            <ellipse cx="90" cy="105" rx="51" ry="8" fill="#694a3b" opacity=".18" />
            <path d="M48 66h84l-7 34H55z" fill="#f3dfc8" />
            <path d="M48 64c0-9 19-15 42-15s42 6 42 15-19 13-42 13-42-4-42-13Z" fill="#fff1dd" />
            <path d="M57 62c5-6 17-9 33-9s28 3 33 9c-5 4-17 6-33 6s-28-2-33-6Z" fill="#9a684b" />
            <path d="M61 83h58m-54 9h50" stroke="#d3a878" strokeWidth="3" strokeLinecap="round" />
            <path d="M83 48c-2-7 2-12 8-12 4-7 12-5 12 2 8 0 10 6 5 11" fill="#b74745" />
            <path d="m96 38 1-5m7 8 4-3" stroke="#68804f" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  )
}

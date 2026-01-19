import React, { useState, useCallback, useRef, useMemo } from 'react';

// We'll load these from CDN in the HTML, access via window
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Table sizes: landscape orientation (wider than deep)
const TABLE_SIZES = [
  { id: '2x2', label: "2' × 2'", width: 2, height: 2 },
  { id: '3x3', label: "3' × 3'", width: 3, height: 3 },
  { id: '4x4', label: "4' × 4'", width: 4, height: 4 },
  { id: '5x3', label: "5' × 3'", width: 5, height: 3 },
  { id: '5x4', label: "5' × 4'", width: 5, height: 4 },
  { id: '6x4', label: "6' × 4'", width: 6, height: 4 },
];

// Each cell = 6 inches (half foot), so multiply feet by 2
const CELLS_PER_FOOT = 2;
const MAX_BOARD_WIDTH = 540; // Max pixel width for board display

const DEPLOYMENT_COLORS = {
  player1: 'rgba(220, 38, 38, 0.35)',
  player2: 'rgba(37, 99, 235, 0.35)',
};

// SVG Icon Components
const Icons = {
  Ruins: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M3 21h18v-2H3v2zm0-4h3v-3H3v3zm5 0h3v-6H8v6zm5 0h3v-9h-3v9zm5 0h3v-12h-3v12z" opacity="0.9"/>
      <path d="M4 17h1v-2H4v2zm6-3h1v-3h-1v3zm6-3h1v-6h-1v6zm6-3h1v-3h-1v3z" fill="rgba(255,255,255,0.3)"/>
    </svg>
  ),
  Forest: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 2L4 14h3l-2 8h14l-2-8h3L12 2z"/>
      <path d="M12 2L8 8h2l-1.5 4h7L14 8h2L12 2z" fill="rgba(255,255,255,0.2)"/>
    </svg>
  ),
  Hill: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M2 20h20L14 6l-4 6-4-3-4 11z"/>
      <path d="M14 6l-4 6-2-1.5 6 9.5h8L14 6z" fill="rgba(255,255,255,0.15)"/>
    </svg>
  ),
  Water: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M3 17h18v-2c-1.5 0-2.5-.5-3.5-1s-2-1-3.5-1-2.5.5-3.5 1-2 1-3.5 1-2.5-.5-3.5-1-2-1-3.5-1v2h18v2H3v-2z"/>
      <path d="M3 13h18v-2c-1.5 0-2.5-.5-3.5-1s-2-1-3.5-1-2.5.5-3.5 1-2 1-3.5 1-2.5-.5-3.5-1-2-1-3.5-1v2h18v2H3v-2z" opacity="0.7"/>
      <path d="M3 9h18V7c-1.5 0-2.5-.5-3.5-1s-2-1-3.5-1-2.5.5-3.5 1-2 1-3.5 1-2.5-.5-3.5-1-2-1-3.5-1v2h18v2H3V9z" opacity="0.4"/>
    </svg>
  ),
  Crater: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <ellipse cx="12" cy="14" rx="9" ry="5"/>
      <ellipse cx="12" cy="14" rx="6" ry="3" fill="rgba(0,0,0,0.4)"/>
      <ellipse cx="12" cy="13" rx="3" ry="1.5" fill="rgba(0,0,0,0.6)"/>
    </svg>
  ),
  Barricade: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <rect x="2" y="14" width="20" height="6" rx="1"/>
      <rect x="4" y="10" width="16" height="5" rx="1" opacity="0.8"/>
      <rect x="6" y="7" width="12" height="4" rx="1" opacity="0.6"/>
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M4 21V7l8-4 8 4v14H4z"/>
      <path d="M8 10h2v2H8zm0 4h2v2H8zm6-4h2v2h-2zm0 4h2v2h-2z" fill="rgba(255,255,255,0.3)"/>
      <path d="M10 17h4v4h-4z" fill="rgba(0,0,0,0.3)"/>
    </svg>
  ),
  Bunker: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M2 18h20v4H2z"/>
      <path d="M4 12h16v6H4z"/>
      <path d="M6 10h12l-2-4H8l-2 4z"/>
      <rect x="9" y="13" width="6" height="3" fill="rgba(0,0,0,0.4)"/>
    </svg>
  ),
  Objective: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <circle cx="12" cy="12" r="10" opacity="0.3"/>
      <circle cx="12" cy="12" r="6" opacity="0.5"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
    </svg>
  ),
  Flag: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M4 2v20h2v-8h12l-3-4 3-4H6V2H4z"/>
    </svg>
  ),
  Skull: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <circle cx="12" cy="10" r="8"/>
      <circle cx="9" cy="9" r="2" fill="rgba(0,0,0,0.6)"/>
      <circle cx="15" cy="9" r="2" fill="rgba(0,0,0,0.6)"/>
      <path d="M10 14h4l-2 3z" fill="rgba(0,0,0,0.5)"/>
      <path d="M8 18h2v4H8zm6 0h2v4h-2z"/>
    </svg>
  ),
  Relic: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 2L8 7v4l-4 2v4l4 2v3h8v-3l4-2v-4l-4-2V7l-4-5z"/>
      <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.3)"/>
    </svg>
  ),
  Tank: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <rect x="3" y="12" width="18" height="8" rx="2"/>
      <rect x="6" y="8" width="12" height="5" rx="1"/>
      <rect x="14" y="5" width="8" height="4" rx="1"/>
      <circle cx="6" cy="18" r="2" fill="rgba(0,0,0,0.4)"/>
      <circle cx="12" cy="18" r="2" fill="rgba(0,0,0,0.4)"/>
      <circle cx="18" cy="18" r="2" fill="rgba(0,0,0,0.4)"/>
    </svg>
  ),
  Trench: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M2 14h20v6H2z" opacity="0.6"/>
      <path d="M4 12h16v4H4z"/>
      <path d="M0 12h4l1-2h14l1 2h4v2H0z"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
};

const IconComponent = ({ name, size = 24 }) => {
  const Icon = Icons[name];
  if (!Icon) return null;
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon />
    </div>
  );
};

// Game system definitions
const GAME_SYSTEMS = {
  '40k': {
    name: 'Warhammer 40,000',
    shortName: '40K',
    primaryColor: '#dc2626',
    terrain: [
      { id: 'ruins', name: 'Ruins', icon: 'Ruins', color: '#71717a', rules: 'Light Cover, Breachable' },
      { id: 'dense_ruins', name: 'Dense Ruins', icon: 'Building', color: '#52525b', rules: 'Dense Cover, Breachable' },
      { id: 'woods', name: 'Woods', icon: 'Forest', color: '#22c55e', rules: 'Light Cover, Dense Cover' },
      { id: 'hills', name: 'Hills', icon: 'Hill', color: '#eab308', rules: 'Scalable' },
      { id: 'craters', name: 'Craters', icon: 'Crater', color: '#78716c', rules: 'Light Cover' },
      { id: 'barricades', name: 'Barricades', icon: 'Barricade', color: '#a8a29e', rules: 'Light Cover, Obstacle' },
      { id: 'armored_container', name: 'Armored Container', icon: 'Bunker', color: '#3b82f6', rules: 'Heavy Cover, Obstacle' },
      { id: 'battlescape', name: 'Battlescape', icon: 'Tank', color: '#f97316', rules: 'Difficult Ground, Light Cover' },
    ],
    objectives: [
      { id: 'primary', name: 'Primary', icon: 'Objective', color: '#eab308' },
      { id: 'secondary', name: 'Secondary', icon: 'Flag', color: '#a855f7' },
      { id: 'relic', name: 'Relic', icon: 'Star', color: '#ec4899' },
    ],
    deployments: [
      { id: 'dawn_of_war', name: 'Dawn of War', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'hammer_anvil', name: 'Hammer & Anvil', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'search_destroy', name: 'Search & Destroy', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'sweeping', name: 'Sweeping Engagement', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
    ],
    twists: [
      { name: 'Night Fighting', effect: 'Maximum engagement range is 24" unless unit is within 12"' },
      { name: 'Psychic Storm', effect: 'Add 1 to Psychic tests. Perils occur on any double.' },
      { name: 'Orbital Bombardment', effect: 'At start of each round, D3 mortal wounds to a random unit' },
      { name: 'Fog of War', effect: 'Maximum range for shooting is 24" in Round 1' },
      { name: 'Sacred Ground', effect: 'Units within 3" of objectives have 5+ invulnerable save' },
      { name: 'Desperate Fury', effect: 'Units below half strength re-roll wound rolls of 1' },
      { name: 'Warp Surge', effect: 'PSYKER units may attempt one additional psychic power' },
      { name: 'Scorched Earth', effect: 'At end of your turn, you may destroy one objective you control for 3VP' },
    ],
    victories: [
      { name: 'Take and Hold', desc: 'Score VP for controlling objectives at end of each round', scoring: '4VP per objective held' },
      { name: 'Purge the Enemy', desc: 'Score VP for destroying enemy units', scoring: '2VP per unit destroyed' },
      { name: 'Domination', desc: 'Score VP for controlling more objectives than opponent', scoring: '5VP if controlling more' },
      { name: 'The Relic', desc: 'Capture and hold the central relic', scoring: '5VP per round holding relic' },
    ],
    terms: { player1: 'Attacker', player2: 'Defender', round: 'Battle Round' },
  },
  'aos': {
    name: 'Age of Sigmar',
    shortName: 'AoS',
    primaryColor: '#7c3aed',
    terrain: [
      { id: 'wyldwood', name: 'Wyldwood', icon: 'Forest', color: '#166534', rules: 'Overgrown, Deadly' },
      { id: 'ruins', name: 'Arcane Ruins', icon: 'Ruins', color: '#6366f1', rules: 'Defensible, Arcane' },
      { id: 'realmgate', name: 'Realmgate', icon: 'Relic', color: '#8b5cf6', rules: 'Impassable, Arcane' },
      { id: 'azyrite', name: 'Azyrite Ruins', icon: 'Building', color: '#0ea5e9', rules: 'Defensible, Inspiring' },
      { id: 'nexus', name: 'Nexus Syphon', icon: 'Objective', color: '#f43f5e', rules: 'Arcane, Deadly' },
      { id: 'shardgate', name: 'Shardgate', icon: 'Bunker', color: '#14b8a6', rules: 'Garrison, Impassable' },
      { id: 'charnel', name: 'Charnel Throne', icon: 'Skull', color: '#78716c', rules: 'Inspiring, Deadly' },
      { id: 'timeworn', name: 'Timeworn Ruins', icon: 'Ruins', color: '#a3a3a3', rules: 'Defensible, Unstable' },
    ],
    objectives: [
      { id: 'primary', name: 'Primary', icon: 'Objective', color: '#eab308' },
      { id: 'secondary', name: 'Secondary', icon: 'Flag', color: '#a855f7' },
      { id: 'relic', name: 'Relic', icon: 'Star', color: '#ec4899' },
    ],
    deployments: [
      { id: 'battle_lines', name: 'Battle Lines', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'flank_attack', name: 'Flank Attack', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'encircle', name: 'Encircle', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'refused_flank', name: 'Refused Flank', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
    ],
    twists: [
      { name: 'Realm of Fire', effect: 'Re-roll wound rolls of 1 for attacks with melee weapons' },
      { name: 'Realm of Shadow', effect: 'Subtract 1 from hit rolls for attacks over 12"' },
      { name: 'Realm of Death', effect: 'Roll a die for each wound; on 6 it is negated' },
      { name: 'Realm of Beasts', effect: 'Add 1 to charge rolls for monsters' },
      { name: 'Arcane Surge', effect: 'Add 1 to casting rolls for all wizards' },
      { name: 'Blood Rain', effect: 'At start of round, D3 mortal wounds to a random unit' },
      { name: 'Wild Magic', effect: 'Unmodified casting roll of 1 or 2 is always a miscast' },
      { name: 'Spirit Hosts', effect: 'Cover provides +2 to save instead of +1' },
    ],
    victories: [
      { name: 'Domination', desc: 'Control objectives at end of each battle round', scoring: '2VP per objective' },
      { name: 'Annihilation', desc: 'Destroy enemy units', scoring: '1VP per unit destroyed' },
      { name: 'King of the Hill', desc: 'Control the central objective', scoring: '5VP per round' },
      { name: 'Treasure Hunt', desc: 'Capture objective tokens and return to your territory', scoring: '3VP per token' },
    ],
    terms: { player1: 'Attacker', player2: 'Defender', round: 'Battle Round' },
  },
  'opr': {
    name: 'One Page Rules',
    shortName: 'OPR',
    primaryColor: '#22c55e',
    terrain: [
      { id: 'woods', name: 'Woods', icon: 'Forest', color: '#22c55e', rules: 'Soft Cover, Difficult' },
      { id: 'ruins', name: 'Ruins', icon: 'Ruins', color: '#71717a', rules: 'Hard Cover' },
      { id: 'hills', name: 'Hills', icon: 'Hill', color: '#eab308', rules: 'Elevated' },
      { id: 'water', name: 'Water', icon: 'Water', color: '#3b82f6', rules: 'Dangerous, Difficult' },
      { id: 'walls', name: 'Walls', icon: 'Barricade', color: '#a8a29e', rules: 'Hard Cover, Obstacle' },
      { id: 'buildings', name: 'Buildings', icon: 'Building', color: '#64748b', rules: 'Hard Cover, Garrison' },
      { id: 'craters', name: 'Craters', icon: 'Crater', color: '#78716c', rules: 'Soft Cover, Difficult' },
      { id: 'bunker', name: 'Bunker', icon: 'Bunker', color: '#475569', rules: 'Hard Cover, Garrison' },
    ],
    objectives: [
      { id: 'primary', name: 'Primary', icon: 'Objective', color: '#22c55e' },
      { id: 'secondary', name: 'Secondary', icon: 'Flag', color: '#3b82f6' },
      { id: 'special', name: 'Special', icon: 'Star', color: '#f59e0b' },
    ],
    deployments: [
      { id: 'frontline', name: 'Frontline', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'long_war', name: 'Long War', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'ambush', name: 'Ambush', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'patrol', name: 'Patrol', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
    ],
    twists: [
      { name: 'Night Fight', effect: 'Units over 24" away get Stealth' },
      { name: 'Unstable Ground', effect: 'Difficult terrain is also Dangerous' },
      { name: 'Heavy Fog', effect: 'Max range for shooting is 18"' },
      { name: 'Defensive', effect: 'Defender deploys second and goes first' },
      { name: 'Meeting Engagement', effect: 'Both players deploy simultaneously' },
      { name: 'Reserves', effect: 'Half your army starts in reserve' },
      { name: 'Dawn Assault', effect: 'First round, all shooting is at -1 to hit' },
      { name: 'Orbital Strike', effect: 'Each round, D3 hits on a random unit' },
    ],
    victories: [
      { name: 'Hold Ground', desc: 'Control objectives at game end', scoring: '3VP per objective' },
      { name: 'Secure & Control', desc: 'Control more objectives than enemy', scoring: '1VP per round' },
      { name: 'Breakthrough', desc: 'Get units into enemy deployment', scoring: '2VP per unit' },
      { name: 'Total War', desc: 'Destroy enemy army', scoring: 'Win by destruction' },
    ],
    terms: { player1: 'Player A', player2: 'Player B', round: 'Round' },
  },
  'bolt': {
    name: 'Bolt Action',
    shortName: 'BA',
    primaryColor: '#78716c',
    terrain: [
      { id: 'building', name: 'Building', icon: 'Building', color: '#71717a', rules: 'Hard Cover, -3 Pen' },
      { id: 'woods', name: 'Woods', icon: 'Forest', color: '#22c55e', rules: 'Soft Cover, Difficult' },
      { id: 'hedge', name: 'Hedge/Bocage', icon: 'Barricade', color: '#166534', rules: 'Soft Cover, Linear' },
      { id: 'wall', name: 'Stone Wall', icon: 'Barricade', color: '#a8a29e', rules: 'Hard Cover, Linear' },
      { id: 'trench', name: 'Trench', icon: 'Trench', color: '#78716c', rules: 'Hard Cover, Down' },
      { id: 'crater', name: 'Shell Crater', icon: 'Crater', color: '#57534e', rules: 'Soft Cover' },
      { id: 'wreck', name: 'Vehicle Wreck', icon: 'Tank', color: '#44403c', rules: 'Hard Cover, Obstacle' },
      { id: 'bunker', name: 'Bunker/Pillbox', icon: 'Bunker', color: '#52525b', rules: 'Hard Cover, -4 Pen' },
    ],
    objectives: [
      { id: 'objective', name: 'Objective', icon: 'Objective', color: '#eab308' },
      { id: 'intel', name: 'Intel', icon: 'Flag', color: '#3b82f6' },
      { id: 'demolition', name: 'Demolition', icon: 'Skull', color: '#ef4444' },
    ],
    deployments: [
      { id: 'meeting', name: 'Meeting Engagement', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'prepared', name: 'Prepared Positions', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'flanking', name: 'Flanking Assault', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'envelopment', name: 'Envelopment', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
    ],
    twists: [
      { name: 'Night Fighting', effect: '12" visibility; spotting required beyond' },
      { name: 'Air Support', effect: 'Roll for air strike each turn' },
      { name: 'Artillery Barrage', effect: 'Pre-game bombardment on defender' },
      { name: 'Dawn Assault', effect: 'Night rules Turn 1, normal after' },
      { name: 'Fog of War', effect: 'Hidden deployment allowed' },
      { name: 'Tank War', effect: 'All vehicles gain +1 armor' },
      { name: 'Urban Combat', effect: 'Buildings give -4 Pen modifier' },
      { name: 'Amphibious', effect: 'Attacker arrives from water edge' },
    ],
    victories: [
      { name: 'Point Defense', desc: 'Defend objectives from attacker', scoring: '3VP per objective held' },
      { name: 'Key Positions', desc: 'Capture strategic positions', scoring: '2VP per position' },
      { name: 'Demolition', desc: 'Destroy enemy base objective', scoring: 'Win by destruction' },
      { name: 'Top Secret', desc: 'Capture intel and escape', scoring: '5VP for intel' },
    ],
    terms: { player1: 'Attacker', player2: 'Defender', round: 'Turn' },
  },
  'custom': {
    name: 'Custom / Other',
    shortName: 'Custom',
    primaryColor: '#6366f1',
    terrain: [
      { id: 'cover_light', name: 'Light Cover', icon: 'Forest', color: '#22c55e', rules: 'Soft cover' },
      { id: 'cover_heavy', name: 'Heavy Cover', icon: 'Ruins', color: '#71717a', rules: 'Hard cover' },
      { id: 'difficult', name: 'Difficult Ground', icon: 'Water', color: '#3b82f6', rules: 'Slows movement' },
      { id: 'impassable', name: 'Impassable', icon: 'Hill', color: '#78716c', rules: 'Cannot cross' },
      { id: 'elevated', name: 'Elevated', icon: 'Hill', color: '#eab308', rules: 'Height advantage' },
      { id: 'building', name: 'Building', icon: 'Building', color: '#64748b', rules: 'Garrisonable' },
      { id: 'obstacle', name: 'Obstacle', icon: 'Barricade', color: '#a8a29e', rules: 'Blocks movement' },
      { id: 'hazard', name: 'Hazard', icon: 'Skull', color: '#ef4444', rules: 'Dangerous' },
    ],
    objectives: [
      { id: 'objective', name: 'Objective', icon: 'Objective', color: '#6366f1' },
      { id: 'secondary', name: 'Secondary', icon: 'Flag', color: '#22c55e' },
      { id: 'special', name: 'Special', icon: 'Star', color: '#f59e0b' },
    ],
    deployments: [
      { id: 'standard', name: 'Standard', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'corners', name: 'Corner Deploy', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'sides', name: 'Long Edges', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
      { id: 'diagonal', name: 'Diagonal', zones: { player1: [[0, 0, 1, 1]], player2: [[0, 0, 1, 1]] } },
    ],
    twists: [
      { name: 'Night Battle', effect: 'Reduced visibility - define range limits' },
      { name: 'Reserves', effect: 'Some units start off-table' },
      { name: 'Ambush', effect: 'Hidden deployment allowed' },
      { name: 'Fog of War', effect: 'Limited information about enemy' },
      { name: 'Time Limit', effect: 'Game ends after X turns' },
      { name: 'Random Events', effect: 'Roll for events each turn' },
      { name: 'Asymmetric Forces', effect: 'Unequal army sizes' },
      { name: 'Variable Objectives', effect: 'Objectives change mid-game' },
    ],
    victories: [
      { name: 'Control Objectives', desc: 'Hold objectives at game end', scoring: 'Define VP per objective' },
      { name: 'Eliminate Enemy', desc: 'Destroy enemy forces', scoring: 'Define VP per unit' },
      { name: 'Achieve Goal', desc: 'Complete specific mission goal', scoring: 'Win/Lose condition' },
      { name: 'Victory Points', desc: 'Most VP at end wins', scoring: 'Define scoring method' },
    ],
    terms: { player1: 'Player 1', player2: 'Player 2', round: 'Turn' },
  },
};

export default function MissionSmith() {
  const [gameSystem, setGameSystem] = useState('40k');
  const [tableSize, setTableSize] = useState('4x4');
  const [boardElements, setBoardElements] = useState({ terrain: [], objectives: [], deploymentZones: [] });
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [missionName, setMissionName] = useState('Unnamed Mission');
  const [missionTwist, setMissionTwist] = useState(null);
  const [victoryCondition, setVictoryCondition] = useState(null);
  const [paintingPlayer, setPaintingPlayer] = useState('player1');
  const [isPainting, setIsPainting] = useState(false);
  const [showMissionPanel, setShowMissionPanel] = useState(false);
  const boardRef = useRef(null);

  const system = GAME_SYSTEMS[gameSystem];
  
  // Calculate grid dimensions based on table size
  const gridDimensions = useMemo(() => {
    const table = TABLE_SIZES.find(t => t.id === tableSize);
    const gridWidth = table.width * CELLS_PER_FOOT;
    const gridHeight = table.height * CELLS_PER_FOOT;
    
    // Calculate cell size to fit in available space while maintaining aspect ratio
    const cellSize = Math.floor(MAX_BOARD_WIDTH / Math.max(gridWidth, gridHeight));
    const boardWidth = gridWidth * cellSize;
    const boardHeight = gridHeight * cellSize;
    
    return { gridWidth, gridHeight, cellSize, boardWidth, boardHeight };
  }, [tableSize]);
  
  const { gridWidth, gridHeight, cellSize, boardWidth, boardHeight } = gridDimensions;

  const getCellFromEvent = useCallback((e) => {
    const x = Math.floor(e.nativeEvent.offsetX / cellSize);
    const y = Math.floor(e.nativeEvent.offsetY / cellSize);
    return { x: Math.max(0, Math.min(x, gridWidth - 1)), y: Math.max(0, Math.min(y, gridHeight - 1)) };
  }, [cellSize, gridWidth, gridHeight]);

  const handleBoardClick = useCallback((e) => {
    const cell = getCellFromEvent(e);
    
    if (selectedTool?.type === 'terrain') {
      const existing = boardElements.terrain.find(t => t.x === cell.x && t.y === cell.y);
      if (existing) {
        setBoardElements(prev => ({
          ...prev,
          terrain: prev.terrain.filter(t => !(t.x === cell.x && t.y === cell.y))
        }));
      } else {
        setBoardElements(prev => ({
          ...prev,
          terrain: [...prev.terrain, { ...cell, terrainType: selectedTool.item }]
        }));
      }
    } else if (selectedTool?.type === 'objective') {
      const existing = boardElements.objectives.find(o => o.x === cell.x && o.y === cell.y);
      if (existing) {
        setBoardElements(prev => ({
          ...prev,
          objectives: prev.objectives.filter(o => !(o.x === cell.x && o.y === cell.y))
        }));
      } else {
        setBoardElements(prev => ({
          ...prev,
          objectives: [...prev.objectives, { ...cell, objectiveType: selectedTool.item, number: prev.objectives.length + 1 }]
        }));
      }
    }
  }, [selectedTool, boardElements, getCellFromEvent]);

  const handleDeploymentPaint = useCallback((e) => {
    if (selectedTool?.type !== 'deployment') return;
    const cell = getCellFromEvent(e);
    
    setBoardElements(prev => {
      const existing = prev.deploymentZones.find(z => z.x === cell.x && z.y === cell.y);
      if (existing?.player === paintingPlayer) {
        return { ...prev, deploymentZones: prev.deploymentZones.filter(z => !(z.x === cell.x && z.y === cell.y)) };
      }
      const filtered = prev.deploymentZones.filter(z => !(z.x === cell.x && z.y === cell.y));
      return { ...prev, deploymentZones: [...filtered, { ...cell, player: paintingPlayer }] };
    });
  }, [selectedTool, paintingPlayer, getCellFromEvent]);

  const handleMouseDown = (e) => {
    if (selectedTool?.type === 'deployment') {
      setIsPainting(true);
      handleDeploymentPaint(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isPainting && selectedTool?.type === 'deployment') {
      handleDeploymentPaint(e);
    }
  };

  const handleMouseUp = () => setIsPainting(false);

  // Generate deployment zones based on pattern and current grid size
  const generateDeploymentZones = useCallback((patternId) => {
    const zones = [];
    const w = gridWidth;
    const h = gridHeight;
    
    switch (patternId) {
      case 'dawn_of_war':
      case 'battle_lines':
      case 'frontline':
      case 'standard':
      case 'meeting':
        // Top 2 rows vs bottom 2 rows
        for (let x = 0; x < w; x++) {
          for (let y = 0; y < 2; y++) zones.push({ x, y, player: 'player1' });
          for (let y = h - 2; y < h; y++) zones.push({ x, y, player: 'player2' });
        }
        break;
      case 'hammer_anvil':
      case 'long_war':
      case 'sides':
        // Left 2 columns vs right 2 columns
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < 2; x++) zones.push({ x, y, player: 'player1' });
          for (let x = w - 2; x < w; x++) zones.push({ x, y, player: 'player2' });
        }
        break;
      case 'search_destroy':
      case 'corners':
      case 'encircle':
      case 'ambush':
        // Corner deployment
        for (let x = 0; x < Math.ceil(w / 3); x++) {
          for (let y = 0; y < Math.ceil(h / 3); y++) zones.push({ x, y, player: 'player1' });
        }
        for (let x = w - Math.ceil(w / 3); x < w; x++) {
          for (let y = h - Math.ceil(h / 3); y < h; y++) zones.push({ x, y, player: 'player2' });
        }
        break;
      case 'sweeping':
      case 'diagonal':
      case 'flank_attack':
      case 'refused_flank':
      case 'patrol':
      case 'flanking':
      case 'envelopment':
      case 'prepared':
      default:
        // Diagonal deployment
        for (let x = 0; x < w; x++) {
          for (let y = 0; y < h; y++) {
            if (x + y < Math.ceil((w + h) / 3)) zones.push({ x, y, player: 'player1' });
            if (x + y >= Math.floor(2 * (w + h) / 3)) zones.push({ x, y, player: 'player2' });
          }
        }
        break;
    }
    return zones;
  }, [gridWidth, gridHeight]);

  const applyDeploymentPattern = (pattern) => {
    setSelectedTool(null);
    setSelectedDeployment(pattern.id);
    const zones = generateDeploymentZones(pattern.id);
    setBoardElements(prev => ({ ...prev, deploymentZones: zones }));
  };

  const randomizeMission = () => {
    const pattern = system.deployments[Math.floor(Math.random() * system.deployments.length)];
    applyDeploymentPattern(pattern);
    
    setMissionTwist(system.twists[Math.floor(Math.random() * system.twists.length)]);
    setVictoryCondition(system.victories[Math.floor(Math.random() * system.victories.length)]);
    
    const objectives = [];
    const usedCells = new Set();
    const numObjectives = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numObjectives; i++) {
      let x, y, key;
      let attempts = 0;
      do {
        x = 1 + Math.floor(Math.random() * (gridWidth - 2));
        y = 1 + Math.floor(Math.random() * (gridHeight - 2));
        key = `${x},${y}`;
        attempts++;
      } while (usedCells.has(key) && attempts < 50);
      usedCells.add(key);
      objectives.push({
        x, y,
        objectiveType: i === 0 ? system.objectives[0] : system.objectives[Math.floor(Math.random() * system.objectives.length)],
        number: i + 1
      });
    }
    
    const terrain = [];
    const numTerrain = Math.max(4, Math.floor((gridWidth * gridHeight) / 6));
    for (let i = 0; i < numTerrain; i++) {
      let x, y, key;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * gridWidth);
        y = Math.floor(Math.random() * gridHeight);
        key = `${x},${y}`;
        attempts++;
      } while (usedCells.has(key) && attempts < 50);
      usedCells.add(key);
      terrain.push({
        x, y,
        terrainType: system.terrain[Math.floor(Math.random() * system.terrain.length)]
      });
    }
    
    setBoardElements(prev => ({ ...prev, objectives, terrain }));
    setMissionName(`${system.shortName} Mission ${Math.floor(Math.random() * 900) + 100}`);
    setShowMissionPanel(true);
  };

  const clearBoard = () => {
    setBoardElements({ terrain: [], objectives: [], deploymentZones: [] });
    setSelectedDeployment(null);
    setSelectedTool(null);
    setMissionTwist(null);
    setVictoryCondition(null);
    setMissionName('Unnamed Mission');
    setShowMissionPanel(false);
  };

  const handleTableSizeChange = (newSize) => {
    setTableSize(newSize);
    clearBoard();
  };

  const fileInputRef = useRef(null);
  
  const importMission = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Set basic mission info
        if (data.name) setMissionName(data.name);
        if (data.system && GAME_SYSTEMS[data.system]) setGameSystem(data.system);
        if (data.tableSize && TABLE_SIZES.find(t => t.id === data.tableSize)) {
          setTableSize(data.tableSize);
        }
        if (data.deployment) setSelectedDeployment(data.deployment);
        if (data.twist) setMissionTwist(data.twist);
        if (data.victory) setVictoryCondition(data.victory);
        
        // Reconstruct terrain with full terrainType objects
        const sys = GAME_SYSTEMS[data.system] || system;
        const terrain = (data.terrain || []).map(t => {
          const terrainType = sys.terrain.find(tt => tt.id === t.id || tt.name === t.type) || sys.terrain[0];
          return { x: t.x, y: t.y, terrainType };
        });
        
        // Reconstruct objectives with full objectiveType objects
        const objectives = (data.objectives || []).map(o => {
          const objectiveType = sys.objectives.find(ot => ot.id === o.id || ot.name === o.type) || sys.objectives[0];
          return { x: o.x, y: o.y, objectiveType, number: o.number };
        });
        
        setBoardElements({
          terrain,
          objectives,
          deploymentZones: data.deploymentZones || [],
        });
        
        setShowMissionPanel(true);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import mission. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input so the same file can be imported again
    e.target.value = '';
  };

  const [isExporting, setIsExporting] = useState(false);
  
  const exportMission = async () => {
    setIsExporting(true);
    
    try {
      // Load libraries from CDN
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      
      const zip = new window.JSZip();
      const safeName = missionName.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Generate JSON data
      const data = {
        name: missionName,
        system: gameSystem,
        systemName: system.name,
        tableSize,
        tableSizeLabel: TABLE_SIZES.find(t => t.id === tableSize)?.label,
        gridDimensions: { width: gridWidth, height: gridHeight },
        deployment: selectedDeployment,
        twist: missionTwist,
        victory: victoryCondition,
        terrain: boardElements.terrain.map(t => ({ x: t.x, y: t.y, type: t.terrainType.name, id: t.terrainType.id })),
        objectives: boardElements.objectives.map(o => ({ x: o.x, y: o.y, type: o.objectiveType.name, id: o.objectiveType.id, number: o.number })),
        deploymentZones: boardElements.deploymentZones,
        exportedAt: new Date().toISOString(),
      };
      
      zip.file(`${safeName}.json`, JSON.stringify(data, null, 2));
      
      // Generate PNG of the board
      if (boardRef.current) {
        const canvas = await window.html2canvas(boardRef.current, {
          backgroundColor: '#18181b',
          scale: 2, // Higher resolution
        });
        
        const pngData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`${safeName}.png`, pngData, { base64: true });
      }
      
      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
      color: '#fafafa',
      fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .panel {
          background: linear-gradient(180deg, rgba(39,39,42,0.95) 0%, rgba(24,24,27,0.98) 100%);
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 16px;
        }
        
        .panel-title {
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: ${system.primaryColor};
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #3f3f46;
        }
        
        .btn {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #3f3f46;
          background: #27272a;
          color: #e4e4e7;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .btn:hover {
          background: #3f3f46;
          border-color: #52525b;
        }
        
        .btn.active {
          background: ${system.primaryColor}25;
          border-color: ${system.primaryColor};
          color: ${system.primaryColor};
        }
        
        .btn-primary {
          background: ${system.primaryColor};
          border-color: ${system.primaryColor};
          color: white;
        }
        
        .btn-primary:hover {
          filter: brightness(1.1);
          background: ${system.primaryColor};
        }
        
        .terrain-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
          margin-bottom: 4px;
        }
        
        .terrain-item:hover {
          background: rgba(255,255,255,0.05);
        }
        
        .terrain-item.active {
          background: rgba(255,255,255,0.1);
          border-color: #52525b;
        }
        
        .terrain-item .icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        select {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #3f3f46;
          background: #27272a;
          color: #e4e4e7;
          cursor: pointer;
          outline: none;
        }
        
        select:focus {
          border-color: ${system.primaryColor};
        }
        
        input[type="text"] {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 12px;
          border-radius: 4px;
          border: 1px solid #3f3f46;
          background: #18181b;
          color: #fafafa;
          width: 100%;
          outline: none;
        }
        
        input[type="text"]:focus {
          border-color: ${system.primaryColor};
        }
      `}</style>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #27272a',
        background: 'rgba(9,9,11,0.8)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '22px',
            fontWeight: '700',
            color: system.primaryColor,
            letterSpacing: '3px',
          }}>
            MISSIONSMITH
          </h1>
          <span style={{ 
            fontSize: '11px', 
            color: '#71717a', 
            fontWeight: '500',
            letterSpacing: '1px',
          }}>
            MISSION GENERATOR
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={gameSystem} 
            onChange={(e) => { setGameSystem(e.target.value); clearBoard(); }}
            style={{ minWidth: '160px' }}
          >
            {Object.entries(GAME_SYSTEMS).map(([key, sys]) => (
              <option key={key} value={key}>{sys.name}</option>
            ))}
          </select>
          
          <select 
            value={tableSize} 
            onChange={(e) => handleTableSizeChange(e.target.value)}
            style={{ minWidth: '100px' }}
          >
            {TABLE_SIZES.map(size => (
              <option key={size.id} value={size.id}>{size.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={randomizeMission} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconComponent name="Zap" size={16} />
            Generate
          </button>
          <button className="btn" onClick={exportMission} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isExporting ? 0.6 : 1 }}>
            <IconComponent name="Flag" size={16} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconComponent name="Relic" size={16} />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importMission}
            style={{ display: 'none' }}
          />
          <button className="btn" onClick={clearBoard} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconComponent name="Skull" size={16} />
            Clear
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', padding: '20px', gap: '20px', minHeight: 'calc(100vh - 65px)' }}>
        
        {/* Left Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          
          {/* Mission Name */}
          <div className="panel">
            <div className="panel-title">Mission</div>
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="Mission Name"
            />
          </div>

          {/* Deployment */}
          <div className="panel">
            <div className="panel-title">Deployment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              {system.deployments.map(dep => (
                <button
                  key={dep.id}
                  className={`btn ${selectedDeployment === dep.id ? 'active' : ''}`}
                  onClick={() => applyDeploymentPattern(dep)}
                  style={{ fontSize: '11px', padding: '8px 6px' }}
                >
                  {dep.name}
                </button>
              ))}
            </div>
            <button
              className={`btn ${selectedTool?.type === 'deployment' ? 'active' : ''}`}
              onClick={() => setSelectedTool(selectedTool?.type === 'deployment' ? null : { type: 'deployment' })}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <IconComponent name="Flag" size={14} />
              Paint Zones
            </button>
            {selectedTool?.type === 'deployment' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  className="btn"
                  onClick={() => setPaintingPlayer('player1')}
                  style={{
                    flex: 1,
                    background: paintingPlayer === 'player1' ? 'rgba(220,38,38,0.3)' : undefined,
                    borderColor: paintingPlayer === 'player1' ? '#dc2626' : undefined,
                    color: paintingPlayer === 'player1' ? '#fca5a5' : undefined,
                  }}
                >
                  {system.terms.player1}
                </button>
                <button
                  className="btn"
                  onClick={() => setPaintingPlayer('player2')}
                  style={{
                    flex: 1,
                    background: paintingPlayer === 'player2' ? 'rgba(37,99,235,0.3)' : undefined,
                    borderColor: paintingPlayer === 'player2' ? '#2563eb' : undefined,
                    color: paintingPlayer === 'player2' ? '#93c5fd' : undefined,
                  }}
                >
                  {system.terms.player2}
                </button>
              </div>
            )}
          </div>

          {/* Terrain */}
          <div className="panel" style={{ flex: 1, overflow: 'auto' }}>
            <div className="panel-title">Terrain</div>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {system.terrain.map(terrain => (
                <div
                  key={terrain.id}
                  className={`terrain-item ${selectedTool?.type === 'terrain' && selectedTool?.item?.id === terrain.id ? 'active' : ''}`}
                  onClick={() => setSelectedTool(
                    selectedTool?.type === 'terrain' && selectedTool?.item?.id === terrain.id 
                      ? null 
                      : { type: 'terrain', item: terrain }
                  )}
                >
                  <div className="icon-wrap" style={{ background: `${terrain.color}30`, color: terrain.color }}>
                    <IconComponent name={terrain.icon} size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e4e4e7' }}>{terrain.name}</div>
                    <div style={{ fontSize: '11px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{terrain.rules}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Board */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#71717a', fontFamily: "'Orbitron', monospace" }}>
                {TABLE_SIZES.find(t => t.id === tableSize)?.label} — 6" cells
              </span>
            </div>
            <div 
              ref={boardRef}
              style={{
                width: boardWidth,
                height: boardHeight,
                position: 'relative',
                background: `
                  linear-gradient(rgba(24,24,27,0.85), rgba(24,24,27,0.85)),
                  repeating-linear-gradient(0deg, transparent, transparent ${cellSize - 1}px, #52525b ${cellSize - 1}px, #52525b ${cellSize}px),
                  repeating-linear-gradient(90deg, transparent, transparent ${cellSize - 1}px, #52525b ${cellSize - 1}px, #52525b ${cellSize}px)
                `,
                border: `2px solid #71717a`,
                borderRadius: '4px',
                userSelect: 'none',
                cursor: selectedTool ? 'crosshair' : 'default',
              }}
              onClick={handleBoardClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Deployment Zones */}
              {boardElements.deploymentZones.map((zone, i) => (
                <div
                  key={`zone-${i}`}
                  style={{
                    position: 'absolute',
                    left: zone.x * cellSize,
                    top: zone.y * cellSize,
                    width: cellSize,
                    height: cellSize,
                    background: DEPLOYMENT_COLORS[zone.player],
                    pointerEvents: 'none',
                  }}
                />
              ))}
              
              {/* Terrain */}
              {boardElements.terrain.map((t, i) => (
                <div
                  key={`terrain-${i}`}
                  style={{
                    position: 'absolute',
                    left: t.x * cellSize + 2,
                    top: t.y * cellSize + 2,
                    width: cellSize - 4,
                    height: cellSize - 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${t.terrainType.color}35`,
                    border: `2px solid ${t.terrainType.color}`,
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    color: t.terrainType.color,
                  }}
                >
                  <IconComponent name={t.terrainType.icon} size={Math.max(20, cellSize * 0.5)} />
                </div>
              ))}
              
              {/* Objectives */}
              {boardElements.objectives.map((o, i) => (
                <div
                  key={`objective-${i}`}
                  style={{
                    position: 'absolute',
                    left: o.x * cellSize + 2,
                    top: o.y * cellSize + 2,
                    width: cellSize - 4,
                    height: cellSize - 4,
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `radial-gradient(circle, ${o.objectiveType.color}50 0%, ${o.objectiveType.color}15 70%)`,
                    border: `3px solid ${o.objectiveType.color}`,
                    borderRadius: '50%',
                    boxShadow: `0 0 20px ${o.objectiveType.color}60, inset 0 0 10px ${o.objectiveType.color}30`,
                    pointerEvents: 'none',
                    color: o.objectiveType.color,
                  }}>
                    <IconComponent name={o.objectiveType.icon} size={Math.max(18, cellSize * 0.4)} />
                    <div style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      background: o.objectiveType.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#000',
                      fontFamily: "'Orbitron', monospace",
                    }}>
                      {o.number}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Grid labels */}
              {Array.from({ length: gridWidth }).map((_, i) => (
                <div 
                  key={`col-${i}`}
                  style={{
                    position: 'absolute',
                    left: i * cellSize + cellSize / 2,
                    top: -18,
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#52525b',
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: '600',
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {Array.from({ length: gridHeight }).map((_, i) => (
                <div 
                  key={`row-${i}`}
                  style={{
                    position: 'absolute',
                    left: -18,
                    top: i * cellSize + cellSize / 2,
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    color: '#52525b',
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: '600',
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '24px', 
              marginTop: '16px',
              fontSize: '12px',
              color: '#71717a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 14, height: 14, background: DEPLOYMENT_COLORS.player1, border: '1px solid #dc2626' }} />
                {system.terms.player1}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 14, height: 14, background: DEPLOYMENT_COLORS.player2, border: '1px solid #2563eb' }} />
                {system.terms.player2}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          
          {/* Objectives Palette */}
          <div className="panel">
            <div className="panel-title">Objectives</div>
            {system.objectives.map(obj => (
              <div
                key={obj.id}
                className={`terrain-item ${selectedTool?.type === 'objective' && selectedTool?.item?.id === obj.id ? 'active' : ''}`}
                onClick={() => setSelectedTool(
                  selectedTool?.type === 'objective' && selectedTool?.item?.id === obj.id 
                    ? null 
                    : { type: 'objective', item: obj }
                )}
              >
                <div className="icon-wrap" style={{ background: `${obj.color}30`, color: obj.color }}>
                  <IconComponent name={obj.icon} size={20} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e4e4e7' }}>{obj.name}</div>
              </div>
            ))}
          </div>

          {/* Victory Condition */}
          <div className="panel">
            <div className="panel-title">Victory</div>
            <select 
              value={victoryCondition?.name || ''} 
              onChange={(e) => setVictoryCondition(system.victories.find(v => v.name === e.target.value) || null)}
              style={{ width: '100%' }}
            >
              <option value="">Select condition...</option>
              {system.victories.map(v => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
            {victoryCondition && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#a1a1aa', lineHeight: '1.5' }}>
                <div>{victoryCondition.desc}</div>
                <div style={{ color: system.primaryColor, marginTop: '4px' }}>{victoryCondition.scoring}</div>
              </div>
            )}
          </div>

          {/* Mission Twist */}
          <div className="panel">
            <div className="panel-title">Mission Twist</div>
            <select 
              value={missionTwist?.name || ''} 
              onChange={(e) => setMissionTwist(system.twists.find(t => t.name === e.target.value) || null)}
              style={{ width: '100%' }}
            >
              <option value="">No twist</option>
              {system.twists.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            {missionTwist && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#a1a1aa', lineHeight: '1.5' }}>
                {missionTwist.effect}
              </div>
            )}
          </div>

          {/* Board Summary */}
          <div className="panel">
            <div className="panel-title">Board Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: system.primaryColor, fontFamily: "'Orbitron', monospace" }}>
                  {boardElements.terrain.length}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>Terrain</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: system.primaryColor, fontFamily: "'Orbitron', monospace" }}>
                  {boardElements.objectives.length}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>Objectives</div>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="panel" style={{ fontSize: '12px', color: '#71717a' }}>
            <div className="panel-title">Quick Start</div>
            <ol style={{ paddingLeft: '18px', lineHeight: '1.8' }}>
              <li>Select table size & game system</li>
              <li>Pick a deployment or paint zones</li>
              <li>Select terrain/objectives; click to place</li>
              <li>Set victory & twist rules</li>
              <li>Export or screenshot to share!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
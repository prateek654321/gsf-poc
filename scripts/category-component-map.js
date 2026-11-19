/**
 * Mapping and resolution utility to map Magento categories to automotive Component IDs
 * This ensures the fitment API and catalog queries return only products matching
 * the active category based on component IDs.
 */

// Category ID / Slug to Component IDs dictionary
export const KNOWN_CATEGORY_COMPONENT_MAP = {
  // Service Parts & Maintenance
  5278: [804, 819, 844, 803, 17048, 810, 5359, 5389, 867, 15631], // Service Parts
  5281: [804, 819, 844, 803, 17001, 22091], // Filters
  5284: [844], // Oil Filter
  5287: [804], // Air Filter
  5290: [803], // Fuel Filter
  5293: [819], // Cabin Filter
  5299: [816, 871, 814, 817, 872], // Brake Pads & Discs in Service
  5302: [816], // Brake Pads in Service
  5305: [871], // Brake Discs in Service
  5320: [17048, 22393, 22394, 22404, 808], // Oils & Lubricants
  5323: [17048], // Engine Oil
  5359: [854, 949, 5359, 15419], // Plugs & Glow Plugs
  5362: [854], // Spark Plugs
  5365: [949], // Glow Plug
  5368: [5368, 873], // Timing Belts
  5389: [867, 5389, 22303], // Wiper Blades
  5392: [867], // Wiper Blades
  5413: [15631, 16903, 22281], // Bulbs
  5986: [810, 806, 868, 12114, 12148, 15586], // Electrical
  5992: [810], // Car Battery

  // Braking
  5461: [814, 816, 817, 838, 868, 871, 872, 902, 927, 957, 963, 967, 968, 12044, 12094, 15654, 15712, 16982, 16983, 16984, 17021, 17023], // Braking
  5464: [814, 816, 817, 871, 872, 902, 927, 15654, 17023], // Brake Pads & Discs
  5467: [816], // Brake Pads
  5470: [871], // Brake Discs
  5473: [817], // Brake Pad Wear Sensor
  5476: [902], // Brake Pad Fitting Kit
  5479: [15654], // Brake Pad & Disc Kit
  5494: [12044, 957], // Brake Shoes & Drums
  5521: [963, 967, 12094, 12109, 15585, 16983], // Brake Hydraulics
  5524: [814], // Brake Caliper
  5578: [838], // Brake Cables
  5584: [868, 817, 12110], // Brake Electrical & ABS

  // Steering & Suspension
  5590: [857, 870, 12065, 12112, 15604, 21835, 21836, 21838, 50000, 50001], // Steering & Suspension
  5593: [870, 21835, 21836], // Shocks & Components
  5614: [21836, 21838, 15604], // Springs & Parts
  5629: [857, 12065, 21838, 50001], // Suspension Parts
  5668: [12065, 12112, 21854, 50000], // Steering Parts
  5692: [12112, 50000], // Steering Racks

  // Engine Parts
  5707: [806, 820, 873, 12114, 15586, 15593, 15598, 15599, 15618, 16999, 17024, 17025, 17026, 17027], // Engine Parts

  // Transmission
  5890: [823, 15377, 16996, 17042], // Transmission & Clutch

  // Electrical & Lighting
  5986: [806, 810, 868, 12114, 12148, 15586, 15592, 15598, 15599, 15631, 21841, 21852, 21854], // Electrical
  6019: [805, 841, 868, 888, 921, 12093, 15586, 15592, 15593, 15594, 15597, 15598, 15599, 15603, 15624, 17010, 17012, 17014, 17015, 17029, 17042, 21841, 21850, 21852, 21854, 23044, 23045], // Sensors
  6049: [805], // MAF Sensor (Air Mass Sensor)
  6106: [15631, 16903, 22281], // Lighting

  // Body & Exhaust
  6154: [811, 818, 820, 870, 874, 15643, 15671, 15674, 15676, 15679, 15694, 22369, 22421], // Body & Exhaust
  6514: [808, 15586, 17029, 22100, 22101, 22372], // Cooling & Heating
  6616: [803, 15597, 17015, 21841], // Fuel System
};

// Keyword patterns for dynamic fuzzy matching on component titles
const CATEGORY_KEYWORDS_MAP = [
  {
    tokens: ['brake', 'braking', 'disc', 'pad', 'caliper', 'drum', 'abs'],
    matchComp: (t) => t.includes('brake') || t.includes('disc') || t.includes('pad') || t.includes('caliper') || t.includes('abs') || t.includes('drum'),
  },
  {
    tokens: ['filter', 'air filter', 'oil filter', 'cabin filter', 'fuel filter'],
    matchComp: (t) => t.includes('filter'),
  },
  {
    tokens: ['maf', 'mass sensor', 'air mass', 'airflow'],
    matchComp: (t) => t.includes('maf') || (t.includes('air') && t.includes('sensor')),
  },
  {
    tokens: ['sensor'],
    matchComp: (t) => t.includes('sensor'),
  },
  {
    tokens: ['battery', 'batteries', 'starter', 'alternator', 'electrical'],
    matchComp: (t) => t.includes('battery') || t.includes('alternator') || t.includes('starter') || t.includes('plug') || t.includes('lead'),
  },
  {
    tokens: ['steering', 'suspension', 'shock', 'spring', 'ball joint', 'strut', 'rack'],
    matchComp: (t) => t.includes('steering') || t.includes('suspension') || t.includes('shock') || t.includes('spring') || t.includes('joint') || t.includes('strut'),
  },
  {
    tokens: ['clutch', 'transmission', 'gearbox', 'flywheel'],
    matchComp: (t) => t.includes('clutch') || t.includes('transmission') || t.includes('gear'),
  },
  {
    tokens: ['exhaust', 'catalytic', 'silencer', 'dpf'],
    matchComp: (t) => t.includes('exhaust') || t.includes('catalytic') || t.includes('silencer') || t.includes('dpf') || t.includes('pipe'),
  },
  {
    tokens: ['cooling', 'heating', 'radiator', 'coolant', 'thermostat'],
    matchComp: (t) => t.includes('cool') || t.includes('heat') || t.includes('radiator') || t.includes('antifreeze'),
  },
  {
    tokens: ['engine', 'timing belt', 'camshaft', 'crankshaft', 'gasket', 'valve'],
    matchComp: (t) => t.includes('engine') || t.includes('belt') || t.includes('camshaft') || t.includes('gasket') || t.includes('crankshaft'),
  },
  {
    tokens: ['bulb', 'lighting', 'headlight', 'lamp'],
    matchComp: (t) => t.includes('bulb') || t.includes('light') || t.includes('lamp'),
  },
  {
    tokens: ['wiper', 'blade', 'screen wash'],
    matchComp: (t) => t.includes('wiper') || t.includes('blade'),
  },
];

/**
 * Resolves component IDs mapped to a specific category.
 *
 * @param {object} params
 * @param {string|number} [params.categoryId] Magento category ID
 * @param {string} [params.categoryName] Category name / title
 * @param {Array<number|string>} [params.explicitComponentIds] Explicit component IDs passed via URL / metadata
 * @param {Array<{id: number, title: string}>} [params.vehicleComponents] Components list from the active vehicle
 * @returns {string[]} Array of component ID strings mapped to this category
 */
export function resolveCategoryComponentIds({
  categoryId = '',
  categoryName = '',
  explicitComponentIds = [],
  vehicleComponents = [],
} = {}) {
  // 1. Explicit component IDs take priority
  if (explicitComponentIds && explicitComponentIds.length > 0) {
    return explicitComponentIds.map(String);
  }

  const catIdNum = parseInt(categoryId, 10);
  const matchedIds = new Set();

  // 2. Check known static category-to-component dictionary
  if (catIdNum && KNOWN_CATEGORY_COMPONENT_MAP[catIdNum]) {
    KNOWN_CATEGORY_COMPONENT_MAP[catIdNum].forEach((id) => matchedIds.add(String(id)));
  }

  // 3. Keyword-based matching from category name against vehicle components
  const catText = (categoryName || '').toLowerCase().trim();
  if (catText && vehicleComponents && vehicleComponents.length > 0) {
    for (const pattern of CATEGORY_KEYWORDS_MAP) {
      const isRelevant = pattern.tokens.some((token) => catText.includes(token));
      if (isRelevant) {
        vehicleComponents.forEach((comp) => {
          const compTitle = (comp.title || '').toLowerCase();
          if (pattern.matchComp(compTitle)) {
            matchedIds.add(String(comp.id));
          }
        });
      }
    }
  }

  // 4. Intersect with vehicle's available components if provided
  if (matchedIds.size > 0 && vehicleComponents && vehicleComponents.length > 0) {
    const vehicleCompIdSet = new Set(vehicleComponents.map((c) => String(c.id)));
    const validMapped = [...matchedIds].filter((id) => vehicleCompIdSet.has(id));
    if (validMapped.length > 0) {
      return validMapped;
    }
  }

  return [...matchedIds];
}

/**
 * Authentic GSF Category Targets mapping: maps categories to leaf category IDs
 * and corresponding component IDs for GraphQL ProductFilterWithBrandSort queries.
 */
export const CATEGORY_TARGETS_MAP = {
  // Braking parent & children
  5461: [
    { catId: 5467, compId: '816', name: 'Brake Pads' },
    { catId: 5470, compId: '871', name: 'Brake Discs' },
  ],
  5464: [
    { catId: 5467, compId: '816', name: 'Brake Pads' },
    { catId: 5470, compId: '871', name: 'Brake Discs' },
  ],
  5467: [{ catId: 5467, compId: '816', name: 'Brake Pads' }],
  5470: [{ catId: 5470, compId: '871', name: 'Brake Discs' }],
  5473: [{ catId: 5473, compId: '817', name: 'Brake Pad Wear Sensor' }],
  5476: [{ catId: 5476, compId: '902', name: 'Brake Pad Fitting Kit' }],
  5479: [{ catId: 5479, compId: '15654', name: 'Brake Pad & Disc Kit' }],
  5521: [{ catId: 5524, compId: '814', name: 'Brake Caliper' }],
  5524: [{ catId: 5524, compId: '814', name: 'Brake Caliper' }],

  // Service Parts parent & children
  5278: [
    { catId: 5284, compId: '844', name: 'Oil Filter' },
    { catId: 5287, compId: '804', name: 'Air Filter' },
    { catId: 5293, compId: '819', name: 'Cabin Filter' },
    { catId: 5323, compId: '17048', name: 'Engine Oil' },
    { catId: 5392, compId: '867', name: 'Wiper Blades' },
  ],
  5281: [
    { catId: 5284, compId: '844', name: 'Oil Filter' },
    { catId: 5287, compId: '804', name: 'Air Filter' },
    { catId: 5293, compId: '819', name: 'Cabin Filter' },
  ],
  5284: [{ catId: 5284, compId: '844', name: 'Oil Filter' }],
  5287: [{ catId: 5287, compId: '804', name: 'Air Filter' }],
  5290: [{ catId: 5290, compId: '803', name: 'Fuel Filter' }],
  5293: [{ catId: 5293, compId: '819', name: 'Cabin Filter' }],
  5299: [
    { catId: 5467, compId: '816', name: 'Brake Pads' },
    { catId: 5470, compId: '871', name: 'Brake Discs' },
  ],
  5302: [{ catId: 5467, compId: '816', name: 'Brake Pads' }],
  5305: [{ catId: 5470, compId: '871', name: 'Brake Discs' }],
  5320: [{ catId: 5323, compId: '17048', name: 'Engine Oil' }],
  5323: [{ catId: 5323, compId: '17048', name: 'Engine Oil' }],
  5359: [
    { catId: 5362, compId: '854', name: 'Spark Plugs' },
    { catId: 5365, compId: '949', name: 'Glow Plug' },
  ],
  5362: [{ catId: 5362, compId: '854', name: 'Spark Plugs' }],
  5365: [{ catId: 5365, compId: '949', name: 'Glow Plug' }],
  5389: [{ catId: 5392, compId: '867', name: 'Wiper Blades' }],
  5392: [{ catId: 5392, compId: '867', name: 'Wiper Blades' }],
  5986: [{ catId: 5992, compId: '810', name: 'Car Battery' }],
  5992: [{ catId: 5992, compId: '810', name: 'Car Battery' }],
};

/**
 * Resolves exact category target queries (catId and compId) for any category input
 * @param {string|number} [categoryId]
 * @param {string} [categoryName]
 * @returns {Array<{ catId: number, compId: string, name: string }>}
 */
export function getCategoryTargets(categoryId = '', categoryName = '') {
  const catIdNum = parseInt(categoryId, 10);
  if (catIdNum && CATEGORY_TARGETS_MAP[catIdNum]) {
    return CATEGORY_TARGETS_MAP[catIdNum];
  }

  const name = (categoryName || '').toLowerCase().trim();
  if (name.includes('pad')) return [{ catId: 5467, compId: '816', name: 'Brake Pads' }];
  if (name.includes('disc')) return [{ catId: 5470, compId: '871', name: 'Brake Discs' }];
  if (name.includes('brake') || name.includes('braking')) {
    return [
      { catId: 5467, compId: '816', name: 'Brake Pads' },
      { catId: 5470, compId: '871', name: 'Brake Discs' },
    ];
  }
  if (name.includes('oil filter')) return [{ catId: 5284, compId: '844', name: 'Oil Filter' }];
  if (name.includes('air filter')) return [{ catId: 5287, compId: '804', name: 'Air Filter' }];
  if (name.includes('cabin filter')) return [{ catId: 5293, compId: '819', name: 'Cabin Filter' }];
  if (name.includes('fuel filter')) return [{ catId: 5290, compId: '803', name: 'Fuel Filter' }];
  if (name.includes('filter')) {
    return [
      { catId: 5284, compId: '844', name: 'Oil Filter' },
      { catId: 5287, compId: '804', name: 'Air Filter' },
      { catId: 5293, compId: '819', name: 'Cabin Filter' },
    ];
  }
  if (name.includes('engine oil') || (name.includes('oil') && !name.includes('filter'))) {
    return [{ catId: 5323, compId: '17048', name: 'Engine Oil' }];
  }
  if (name.includes('battery') || name.includes('batteries')) {
    return [{ catId: 5992, compId: '810', name: 'Car Battery' }];
  }
  if (name.includes('wiper')) return [{ catId: 5392, compId: '867', name: 'Wiper Blades' }];
  if (name.includes('spark')) return [{ catId: 5362, compId: '854', name: 'Spark Plugs' }];
  if (name.includes('glow')) return [{ catId: 5365, compId: '949', name: 'Glow Plug' }];

  // Default fallback for Braking
  return [
    { catId: 5467, compId: '816', name: 'Brake Pads' },
    { catId: 5470, compId: '871', name: 'Brake Discs' },
  ];
}

/**
 * Full 3-Level Category Hierarchy Metadata (Level 1 Department -> Level 2 Subcategory -> Level 3 Leaf)
 * Used to render subcategory cards on parent categories (Level 1 & 2),
 * and only display product listings on the leaf categories (Level 3).
 */
export const CATEGORY_HIERARCHY_TREE = [
  {
    id: 5461,
    name: 'Braking',
    level: 1,
    icon: '🛑',
    tag: 'Guaranteed Fit',
    desc: 'High performance brake pads, coated discs, calipers, hydraulics and shoes.',
    children: [
      {
        id: 5464,
        name: 'Brake Pads & Discs',
        level: 2,
        parentId: 5461,
        icon: '🛑',
        tag: 'Bestseller',
        desc: 'Replacement front and rear brake pads, discs, wear sensors and fitting kits.',
        children: [
          { id: 5467, name: 'Brake Pads', compId: '816', level: 3, parentId: 5464, icon: '🛑', tag: 'Guaranteed Fit', desc: 'Front & rear brake pads engineered for maximum stopping power and low dust.' },
          { id: 5470, name: 'Brake Discs', compId: '871', level: 3, parentId: 5464, icon: '💿', tag: 'Anti-Corrosion', desc: 'Vented, solid, and coated brake discs for OE fitment and long service life.' },
          { id: 5473, name: 'Brake Pad Wear Sensor', compId: '817', level: 3, parentId: 5464, icon: '🔌', tag: 'Direct Fit', desc: 'Electronic brake pad wear warning sensors for front and rear axles.' },
          { id: 5476, name: 'Brake Pad Fitting Kit', compId: '902', level: 3, parentId: 5464, icon: '🧰', tag: 'Hardware Kit', desc: 'Caliper guide pins, anti-rattle clips, and retaining springs.' },
          { id: 5479, name: 'Brake Pad & Disc Kit', compId: '15654', level: 3, parentId: 5464, icon: '📦', tag: 'Complete Kit', desc: 'Combined axle sets of matched brake pads and discs.' },
        ],
      },
      {
        id: 5494,
        name: 'Brake Shoes & Drums',
        level: 2,
        parentId: 5461,
        icon: '🛞',
        tag: 'Rear Axle',
        desc: 'Drum brake shoes, cast drums, wheel cylinders and handbrake shoes.',
        children: [
          { id: 5497, name: 'Brake Shoes', compId: '12044', level: 3, parentId: 5494, icon: '🛞', tag: 'OE Fit', desc: 'High friction rear brake shoes for drum brake assemblies.' },
          { id: 5500, name: 'Brake Drums', compId: '957', level: 3, parentId: 5494, icon: '🥁', tag: 'Balanced Cast', desc: 'Precision balanced brake drums for smooth rear braking.' },
          { id: 5506, name: 'Handbrake Shoes', compId: '15661', level: 3, parentId: 5494, icon: '🅿️', tag: 'Parking Brake', desc: 'Internal parking and handbrake shoes for disc/drum setups.' },
        ],
      },
      {
        id: 5521,
        name: 'Brake Hydraulics',
        level: 2,
        parentId: 5461,
        icon: '🗜️',
        tag: 'Hydraulics',
        desc: 'Brake calipers, rebuild kits, hydraulic brake hoses and master cylinders.',
        children: [
          { id: 5524, name: 'Brake Caliper', compId: '814', level: 3, parentId: 5521, icon: '🗜️', tag: 'Brand New', desc: 'Single and multi-piston brake calipers for front and rear axles.' },
          { id: 5527, name: 'Brake Caliper Repair Kit', compId: '872', level: 3, parentId: 5521, icon: '🔧', tag: 'Seals & Pistons', desc: 'Piston seals, dust boots, and guide sleeve repair kits.' },
          { id: 5545, name: 'Brake Hose', compId: '963', level: 3, parentId: 5521, icon: '〰️', tag: 'Flexible Hose', desc: 'Reinforced flexible rubber and braided hydraulic brake lines.' },
          { id: 5548, name: 'Brake Master Cylinder', compId: '967', level: 3, parentId: 5521, icon: '⚙️', tag: 'Tandem Cylinder', desc: 'Primary hydraulic brake master cylinders and fluid reservoirs.' },
        ],
      },
      {
        id: 5578,
        name: 'Brake Cables',
        level: 2,
        parentId: 5461,
        icon: '⛓️',
        tag: 'Mechanical',
        desc: 'Handbrake cables, front/rear parking brake tension cables.',
        children: [
          { id: 5581, name: 'Handbrake Cable', compId: '838', level: 3, parentId: 5578, icon: '⛓️', tag: 'Tension Cable', desc: 'Sheathed parking brake control cables for rear brakes.' },
        ],
      },
      {
        id: 5584,
        name: 'Brake Electrical',
        level: 2,
        parentId: 5461,
        icon: '⚡',
        tag: 'ABS & Sensors',
        desc: 'ABS wheel speed sensors, reluctor rings and brake pedal switches.',
        children: [
          { id: 5587, name: 'Brake Light Switch', compId: '815', level: 3, parentId: 5584, icon: '💡', tag: 'Pedal Switch', desc: 'Stop lamp activation switches mounted at the brake pedal.' },
          { id: 8697, name: 'ABS Ring', compId: '868', level: 3, parentId: 5584, icon: '🛞', tag: 'Reluctor Ring', desc: 'Precision magnetic and toothed ABS wheel speed reluctor rings.' },
        ],
      },
    ],
  },
  {
    id: 5278,
    name: 'Service Parts',
    level: 1,
    icon: '🔧',
    tag: 'Routine Service',
    desc: 'Oil, air, fuel and pollen filters, premium lubricants, spark plugs and wiper blades.',
    children: [
      {
        id: 5281,
        name: 'Filters',
        level: 2,
        parentId: 5278,
        icon: '🔧',
        tag: 'Service Kit',
        desc: 'Engine oil filters, engine air filters, cabin pollen filters, and fuel filters.',
        children: [
          { id: 5284, name: 'Oil Filter', compId: '844', level: 3, parentId: 5281, icon: '🛢️', tag: 'Spin-on & Element', desc: 'High efficiency oil filter inserts and spin-on canisters.' },
          { id: 5287, name: 'Air Filter', compId: '804', level: 3, parentId: 5281, icon: '💨', tag: 'High Flow', desc: 'Pleated engine intake air filters for optimal fuel economy.' },
          { id: 5293, name: 'Cabin Filter', compId: '819', level: 3, parentId: 5281, icon: '🍃', tag: 'Active Carbon', desc: 'Pollen and allergen cabin air filters for clean interior air.' },
          { id: 5290, name: 'Fuel Filter', compId: '803', level: 3, parentId: 5281, icon: '⛽', tag: 'Inline Filter', desc: 'Diesel and petrol fuel filters protecting injectors and pumps.' },
        ],
      },
      {
        id: 5320,
        name: 'Lubricants & Fluids',
        level: 2,
        parentId: 5278,
        icon: '🛢️',
        tag: 'Approved Specs',
        desc: 'Fully synthetic engine oils (5W-30, 0W-20), coolant, brake fluid and screenwash.',
        children: [
          { id: 5323, name: 'Engine Oil', compId: '17048', level: 3, parentId: 5320, icon: '🛢️', tag: 'Manufacturer Spec', desc: '5W-30, 5W-40, 0W-20 and 0W-30 fully synthetic motor oils.' },
          { id: 5326, name: 'Antifreeze & Coolant', compId: '808', level: 3, parentId: 5320, icon: '❄️', tag: 'G12 / G13 / OAT', desc: 'Engine cooling system antifreeze and pre-mixed coolants.' },
          { id: 5329, name: 'Brake Fluid', compId: '22393', level: 3, parentId: 5320, icon: '💧', tag: 'DOT 4 & DOT 5.1', desc: 'High boiling point synthetic hydraulic brake and clutch fluids.' },
          { id: 5332, name: 'Screen Wash', compId: '22394', level: 3, parentId: 5320, icon: '🚿', tag: 'All Season', desc: 'Concentrated and ready-to-use windscreen washer fluid.' },
        ],
      },
      {
        id: 5359,
        name: 'Plugs',
        level: 2,
        parentId: 5278,
        icon: '⚡',
        tag: 'Ignition',
        desc: 'Iridium and platinum spark plugs, ceramic diesel glow plugs.',
        children: [
          { id: 5362, name: 'Spark Plugs', compId: '854', level: 3, parentId: 5359, icon: '⚡', tag: 'Iridium & Laser', desc: 'Petrol engine spark plugs from NGK, Bosch, and Denso.' },
          { id: 5365, name: 'Glow Plug', compId: '949', level: 3, parentId: 5359, icon: '💡', tag: 'Quick Start', desc: 'Diesel cold-start pre-heating glow plugs.' },
        ],
      },
      {
        id: 5368,
        name: 'Timing Belts',
        level: 2,
        parentId: 5278,
        icon: '🔄',
        tag: 'Engine Timing',
        desc: 'Camshaft timing belts, tensioner pulleys, and complete water pump kits.',
        children: [
          { id: 5371, name: 'Timing Belt', compId: '873', level: 3, parentId: 5368, icon: '🔄', tag: 'Reinforced', desc: 'Heavy duty synchronous toothed camshaft drive belts.' },
        ],
      },
      {
        id: 5389,
        name: 'Wiper Blades',
        level: 2,
        parentId: 5278,
        icon: '🌧️',
        tag: 'Clear Vision',
        desc: 'Flat aero beam blades, conventional wiper blades, and rear screen blades.',
        children: [
          { id: 5392, name: 'Wiper Blades', compId: '867', level: 3, parentId: 5389, icon: '🌧️', tag: 'Aero Beam', desc: 'Direct-fit front driver, passenger and rear wiper blades.' },
        ],
      },
    ],
  },
  {
    id: 5590,
    name: 'Steering & Suspension',
    level: 1,
    icon: '🏎️',
    tag: 'Chassis & Handling',
    desc: 'Gas shock absorbers, coil springs, control arms, anti-roll links, and steering racks.',
    children: [
      {
        id: 5593,
        name: 'Shocks & Components',
        level: 2,
        parentId: 5590,
        icon: '⚙️',
        tag: 'Ride Comfort',
        desc: 'Gas-pressurised shock absorbers, strut cartridges, and top mounts.',
        children: [
          { id: 5596, name: 'Shock Absorber', compId: '870', level: 3, parentId: 5593, icon: '⚙️', tag: 'Gas Strut', desc: 'Front strut units and rear shock absorbers.' },
          { id: 5602, name: 'Strut Top Mount', compId: '21835', level: 3, parentId: 5593, icon: '🔘', tag: 'Top Bearing', desc: 'Upper suspension strut mounts and bearings.' },
        ],
      },
      {
        id: 5614,
        name: 'Springs & Parts',
        level: 2,
        parentId: 5590,
        icon: '🌀',
        tag: 'Suspension',
        desc: 'Axle coil springs, suspension bump stops and dust protection kits.',
        children: [
          { id: 5617, name: 'Coil Springs', compId: '21836', level: 3, parentId: 5614, icon: '🌀', tag: 'Matched Pair', desc: 'Standard and sport ride height helical suspension coil springs.' },
        ],
      },
      {
        id: 5629,
        name: 'Suspension Parts',
        level: 2,
        parentId: 5590,
        icon: '🔗',
        tag: 'Linkages',
        desc: 'Track control arms, wishbones, anti-roll bar drop links, and ball joints.',
        children: [
          { id: 5632, name: 'Track Control Arm', compId: '857', level: 3, parentId: 5629, icon: '🔗', tag: 'Wishbone', desc: 'Lower and upper front suspension wishbones and bushings.' },
          { id: 5638, name: 'Anti Roll Bar Link', compId: '12065', level: 3, parentId: 5629, icon: '🦯', tag: 'Drop Link', desc: 'Stabiliser anti-roll bar connecting drop links.' },
          { id: 5644, name: 'Ball Joint', compId: '21838', level: 3, parentId: 5629, icon: '⚪', tag: 'Swivel Joint', desc: 'Lower suspension swivel ball joints.' },
        ],
      },
      {
        id: 5668,
        name: 'Steering Parts',
        level: 2,
        parentId: 5590,
        icon: '🧭',
        tag: 'Steering',
        desc: 'Tie rod track rod ends, inner tie rods, and steering rack gaiters.',
        children: [
          { id: 5671, name: 'Tie Rod End', compId: '12112', level: 3, parentId: 5668, icon: '🧭', tag: 'Track Rod End', desc: 'Outer steering track rod ends for wheel alignment.' },
          { id: 5674, name: 'Tie Rod Assembly', compId: '50000', level: 3, parentId: 5668, icon: '🦯', tag: 'Axial Rod', desc: 'Complete steering tie rod rack ends and boots.' },
        ],
      },
      {
        id: 5692,
        name: 'Steering Rack',
        level: 2,
        parentId: 5590,
        icon: '🕹️',
        tag: 'Steering Gear',
        desc: 'Manual and hydraulic/electric power-assisted steering gearboxes.',
        children: [
          { id: 5695, name: 'Steering Rack', compId: '50001', level: 3, parentId: 5692, icon: '🕹️', tag: 'Power Steering', desc: 'Remanufactured and brand new power steering gear racks.' },
        ],
      },
    ],
  },
  {
    id: 5986,
    name: 'Electrical',
    level: 1,
    icon: '⚡',
    tag: '12V Power & Sensors',
    desc: 'Car batteries (EFB, AGM, standard lead acid), alternators, starter motors, and engine sensors.',
    children: [
      {
        id: 5989,
        name: 'Batteries',
        level: 2,
        parentId: 5986,
        icon: '🔋',
        tag: 'Stop/Start Ready',
        desc: '096, 027, 067 and AGM automotive 12V starter batteries with 3–5 year warranties.',
        children: [
          { id: 5992, name: 'Car Battery', compId: '810', level: 3, parentId: 5989, icon: '🔋', tag: 'Yuasa / Exide', desc: 'High cold cranking amp 12V car and van batteries.' },
        ],
      },
      {
        id: 6019,
        name: 'Sensors',
        level: 2,
        parentId: 5986,
        icon: '📡',
        tag: 'Engine Management',
        desc: 'Mass air flow sensors, lambda oxygen sensors, crankshaft and camshaft position sensors.',
        children: [
          { id: 6049, name: 'MAF Sensor', compId: '805', level: 3, parentId: 6019, icon: '💨', tag: 'Air Mass', desc: 'Precision mass airflow intake sensors.' },
          { id: 6025, name: 'Lambda Sensor', compId: '12093', level: 3, parentId: 6019, icon: '🔥', tag: 'Oxygen Sensor', desc: 'Pre and post-cat exhaust gas oxygen lambda sensors.' },
          { id: 6031, name: 'Crankshaft Sensor', compId: '15598', level: 3, parentId: 6019, icon: '🔄', tag: 'RPM Sensor', desc: 'Engine speed and crankshaft position pulse generators.' },
        ],
      },
      {
        id: 6001,
        name: 'Alternator',
        level: 2,
        parentId: 5986,
        icon: '⚡',
        tag: 'Charging System',
        desc: '12V high output charging alternators with freewheel pulleys.',
        children: [
          { id: 6004, name: 'Alternator', compId: '806', level: 3, parentId: 6001, icon: '⚡', tag: 'OE Reman', desc: 'Brand new and exchange vehicle charging alternators.' },
        ],
      },
      {
        id: 6013,
        name: 'Starter System',
        level: 2,
        parentId: 5986,
        icon: '🔑',
        tag: 'Starting',
        desc: 'Electric starter motors and solenoids for petrol and diesel engines.',
        children: [
          { id: 6016, name: 'Starter Motor', compId: '12114', level: 3, parentId: 6013, icon: '🔑', tag: 'Heavy Duty', desc: 'High torque vehicle starter motors.' },
        ],
      },
    ],
  },
  {
    id: 5707,
    name: 'Engine Parts',
    level: 1,
    icon: '⚙️',
    tag: 'Mechanical',
    desc: 'Timing belts, drive belts, cylinder heads, engine mountings, sumps and gaskets.',
    children: [
      {
        id: 5710,
        name: 'Auxilary Drive',
        level: 2,
        parentId: 5707,
        icon: '🔄',
        tag: 'Serpentine',
        desc: 'V-ribbed alternator serpentine belts, tensioners, and idler pulleys.',
        children: [
          { id: 5713, name: 'Drive Belt', compId: '873', level: 3, parentId: 5710, icon: '🔄', tag: 'Poly-V Belt', desc: 'Multi-ribbed auxiliary alternator and air conditioning belts.' },
        ],
      },
      {
        id: 5785,
        name: 'Mountings',
        level: 2,
        parentId: 5707,
        icon: '🛡️',
        tag: 'Damping',
        desc: 'Hydro and rubber engine support mounts and transmission bushes.',
        children: [
          { id: 5788, name: 'Engine Mount', compId: '15618', level: 3, parentId: 5785, icon: '🛡️', tag: 'Hydro Mount', desc: 'Vibration absorbing engine and gearbox mounts.' },
        ],
      },
    ],
  },
  {
    id: 6514,
    name: 'Cooling & Heating',
    level: 1,
    icon: '❄️',
    tag: 'Thermal',
    desc: 'Engine radiators, water pumps, thermostats, heater matrices and air conditioning parts.',
    children: [
      {
        id: 6544,
        name: 'Cooling System',
        level: 2,
        parentId: 6514,
        icon: '❄️',
        tag: 'Cooling',
        desc: 'Aluminium coolant radiators, mechanical water pumps, and thermostat housings.',
        children: [
          { id: 6547, name: 'Radiator', compId: '808', level: 3, parentId: 6544, icon: '❄️', tag: 'Aluminium Core', desc: 'Engine coolant heat exchanger radiators.' },
          { id: 6550, name: 'Water Pump', compId: '15586', level: 3, parentId: 6544, icon: '💧', tag: 'Metal Impeller', desc: 'Engine coolant circulation water pumps.' },
          { id: 6553, name: 'Thermostat', compId: '17029', level: 3, parentId: 6544, icon: '🌡️', tag: 'Regulator', desc: 'Coolant temperature control thermostat valves.' },
        ],
      },
    ],
  },
];

/**
 * Resolves 3-level breadcrumb path & subcategories for any category ID or name.
 * Determines if current selection is a parent category (has children) or a leaf category (no children).
 *
 * @param {string|number} categoryId
 * @param {string} [categoryName]
 * @returns {{
 *   level: number,
 *   isLeaf: boolean,
 *   current: { id: number, name: string, level: number, icon?: string, tag?: string, desc?: string, compId?: string },
 *   breadcrumbs: Array<{ name: string, href: string }>,
 *   children: Array<{ id: number, name: string, href: string, icon?: string, tag?: string, desc?: string, compId?: string, hasChildren: boolean }>,
 *   siblings: Array<{ id: number, name: string, href: string, active?: boolean }>,
 *   quickLeaves: Array<{ id: number, name: string, href: string }>
 * }}
 */
export function getCategoryNavInfo(categoryId = '', categoryName = '') {
  const catIdNum = parseInt(categoryId, 10);
  const nameNorm = (categoryName || '').toLowerCase().trim();

  // Search hierarchy tree
  for (const l1 of CATEGORY_HIERARCHY_TREE) {
    // 1. Matches Level 1
    if (l1.id === catIdNum || (nameNorm && l1.name.toLowerCase() === nameNorm)) {
      const allLeaves = [];
      const l2Children = (l1.children || []).map((l2) => {
        (l2.children || []).forEach((l3) => allLeaves.push(l3));
        return {
          id: l2.id,
          name: l2.name,
          href: `/plp.html?category_id=${l2.id}&category_name=${encodeURIComponent(l2.name)}`,
          icon: l2.icon || l1.icon || '📦',
          tag: l2.tag || 'Guaranteed Fit',
          desc: l2.desc || `Browse all ${l2.name} categories`,
          hasChildren: Boolean(l2.children && l2.children.length > 0),
        };
      });

      return {
        level: 1,
        isLeaf: false,
        current: { id: l1.id, name: l1.name, level: 1, icon: l1.icon, tag: l1.tag, desc: l1.desc },
        breadcrumbs: [
          { name: 'Home', href: '/' },
          { name: l1.name, href: `/plp.html?category_id=${l1.id}&category_name=${encodeURIComponent(l1.name)}` },
        ],
        children: l2Children,
        subcategories: l2Children,
        siblings: [],
        quickLeaves: allLeaves.slice(0, 6).map((leaf) => ({
          id: leaf.id,
          name: leaf.name,
          href: `/plp.html?category_id=${leaf.id}&category_name=${encodeURIComponent(leaf.name)}`,
        })),
      };
    }

    // 2. Matches Level 2
    for (const l2 of (l1.children || [])) {
      if (l2.id === catIdNum || (nameNorm && l2.name.toLowerCase() === nameNorm)) {
        const l3Children = (l2.children || []).map((l3) => ({
          id: l3.id,
          name: l3.name,
          href: `/plp.html?category_id=${l3.id}&category_name=${encodeURIComponent(l3.name)}`,
          icon: l3.icon || l2.icon || '📦',
          tag: l3.tag || 'Guaranteed Fit',
          desc: l3.desc || `Shop ${l3.name} for your vehicle`,
          compId: l3.compId,
          hasChildren: Boolean(l3.children && l3.children.length > 0),
        }));

        const isLeaf = l3Children.length === 0;

        return {
          level: 2,
          isLeaf,
          current: { id: l2.id, name: l2.name, level: 2, icon: l2.icon, tag: l2.tag, desc: l2.desc },
          breadcrumbs: [
            { name: 'Home', href: '/' },
            { name: l1.name, href: `/plp.html?category_id=${l1.id}&category_name=${encodeURIComponent(l1.name)}` },
            { name: l2.name, href: `/plp.html?category_id=${l2.id}&category_name=${encodeURIComponent(l2.name)}` },
          ],
          children: l3Children,
          subcategories: l3Children,
          siblings: (l1.children || []).map((c) => ({
            id: c.id,
            name: c.name,
            href: `/plp.html?category_id=${c.id}&category_name=${encodeURIComponent(c.name)}`,
            active: c.id === l2.id,
          })),
        };
      }

      // 3. Matches Level 3 (Leaf Category)
      for (const l3 of (l2.children || [])) {
        if (l3.id === catIdNum || (nameNorm && l3.name.toLowerCase() === nameNorm)) {
          return {
            level: 3,
            isLeaf: true,
            current: {
              id: l3.id,
              name: l3.name,
              level: 3,
              compId: l3.compId,
              icon: l3.icon || l2.icon || '📦',
              tag: l3.tag,
              desc: l3.desc,
            },
            breadcrumbs: [
              { name: 'Home', href: '/' },
              { name: l1.name, href: `/plp.html?category_id=${l1.id}&category_name=${encodeURIComponent(l1.name)}` },
              { name: l2.name, href: `/plp.html?category_id=${l2.id}&category_name=${encodeURIComponent(l2.name)}` },
              { name: l3.name, href: `/plp.html?category_id=${l3.id}&category_name=${encodeURIComponent(l3.name)}` },
            ],
            children: [],
            subcategories: [],
            siblings: (l2.children || []).map((c) => ({
              id: c.id,
              name: c.name,
              href: `/plp.html?category_id=${c.id}&category_name=${encodeURIComponent(c.name)}`,
              active: c.id === l3.id,
            })),
          };
        }
      }
    }
  }

  // Fallback: check keywords if parent or leaf
  const isKnownParent = nameNorm.includes('braking') || nameNorm.includes('service') || nameNorm.includes('steering') || nameNorm.includes('suspension') || nameNorm.includes('electrical');
  const displayName = categoryName || (catIdNum ? `Category ${catIdNum}` : 'All Parts');

  return {
    level: isKnownParent ? 1 : 3,
    isLeaf: !isKnownParent,
    current: { id: catIdNum || 5461, name: displayName, level: isKnownParent ? 1 : 3 },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: displayName, href: `/plp.html?category_id=${categoryId}&category_name=${encodeURIComponent(displayName)}` },
    ],
    children: [],
    subcategories: [],
    siblings: [],
  };
}

export default resolveCategoryComponentIds;

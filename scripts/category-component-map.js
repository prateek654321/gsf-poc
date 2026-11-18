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

export default resolveCategoryComponentIds;

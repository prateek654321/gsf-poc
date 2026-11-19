/**
 * Mapping and resolution utility to map Magento categories to automotive Component IDs
 * This ensures the fitment API and catalog queries return only products matching
 * the active category based on component IDs.
 */

// Category ID / Slug to Component IDs dictionary
export const KNOWN_CATEGORY_COMPONENT_MAP = {
  // Top-Level / Department
  5275: [804, 819, 844, 803, 17048, 810, 5359, 5389, 867, 15631, 22303, 22304, 22305, 22306, 814, 816, 871, 872],

  // Service Parts & Maintenance
  5278: [804, 819, 844, 803, 17048, 810, 5359, 5389, 867, 15631, 22303, 22304, 22305, 22306], // Service Parts
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
  5326: [808], // Antifreeze & Coolant
  5329: [22393], // Brake Fluid
  5332: [22394], // Screen Wash
  5359: [854, 949, 5359, 15419], // Plugs & Glow Plugs
  5362: [854], // Spark Plugs
  5365: [949], // Glow Plug
  5368: [5368, 873], // Timing Belts
  5371: [873], // Timing Belt
  5389: [867, 22303, 22304, 22305, 22306], // Wiper Blades parent
  5392: [867], // Wiper Blades leaf
  5395: [22303], // Wiper Arm leaf
  5398: [22304], // Washer Jet leaf
  5401: [22305], // Washer Pump leaf
  5404: [22306], // Wiper Motor leaf
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
  5494: [12044, 957, 15661], // Brake Shoes & Drums
  5497: [12044], // Brake Shoes
  5500: [957], // Brake Drums
  5506: [15661], // Handbrake Shoes
  5521: [963, 967, 12094, 12109, 15585, 16983, 814, 872], // Brake Hydraulics
  5524: [814], // Brake Caliper
  5527: [872], // Brake Caliper Repair Kit
  5545: [963], // Brake Hose
  5548: [967], // Brake Master Cylinder
  5578: [838], // Brake Cables
  5581: [838], // Handbrake Cable
  5584: [868, 815, 12110], // Brake Electrical & ABS
  5587: [815], // Brake Light Switch
  8697: [868], // ABS Ring

  // Steering & Suspension
  5590: [857, 870, 12065, 12112, 15604, 21835, 21836, 21838, 50000, 50001], // Steering & Suspension
  5593: [870, 21835, 21836], // Shocks & Components
  5596: [870], // Shock Absorber
  5602: [21835], // Strut Top Mount
  5614: [21836, 21838, 15604], // Springs & Parts
  5617: [21836], // Coil Springs
  5629: [857, 12065, 21838, 50001], // Suspension Parts
  5632: [857], // Track Control Arm
  5638: [12065], // Anti Roll Bar Link
  5644: [21838], // Ball Joint
  5668: [12065, 12112, 21854, 50000], // Steering Parts
  5671: [12112], // Tie Rod End
  5674: [50000], // Tie Rod Assembly
  5692: [12112, 50000], // Steering Racks
  5695: [50001], // Steering Rack

  // Engine Parts
  5707: [806, 820, 873, 12114, 15586, 15593, 15598, 15599, 15618, 16999, 17024, 17025, 17026, 17027], // Engine Parts
  5710: [873], // Auxilary Drive
  5713: [873], // Drive Belt
  5785: [15618], // Mountings
  5788: [15618], // Engine Mount

  // Transmission
  5890: [823, 15377, 16996, 17042], // Transmission & Clutch

  // Electrical & Lighting
  5986: [806, 810, 868, 12114, 12148, 15586, 15592, 15598, 15599, 15631, 21841, 21852, 21854], // Electrical
  5989: [810], // Batteries
  5992: [810], // Car Battery
  6001: [806], // Alternator
  6004: [806], // Alternator leaf
  6013: [12114], // Starter System
  6016: [12114], // Starter Motor leaf
  6019: [805, 841, 868, 888, 921, 12093, 15586, 15592, 15593, 15594, 15597, 15598, 15599, 15603, 15624, 17010, 17012, 17014, 17015, 17029, 17042, 21841, 21850, 21852, 21854, 23044, 23045], // Sensors
  6049: [805], // MAF Sensor (Air Mass Sensor)
  6025: [12093], // Lambda Sensor
  6031: [15598], // Crankshaft Sensor
  6106: [15631, 16903, 22281], // Lighting

  // Body & Exhaust
  6154: [811, 818, 820, 870, 874, 15643, 15671, 15674, 15676, 15679, 15694, 22369, 22421], // Body & Exhaust
  6514: [808, 15586, 17029, 22100, 22101, 22372], // Cooling & Heating
  6544: [808, 15586, 17029], // Cooling System
  6547: [808], // Radiator
  6550: [15586], // Water Pump
  6553: [17029], // Thermostat
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
  // Top Level
  5275: [
    { catId: 5467, compId: '816', name: 'Brake Pads' },
    { catId: 5470, compId: '871', name: 'Brake Discs' },
    { catId: 5284, compId: '844', name: 'Oil Filter' },
    { catId: 5392, compId: '867', name: 'Wiper Blades' },
  ],

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
  5494: [
    { catId: 5497, compId: '12044', name: 'Brake Shoes' },
    { catId: 5500, compId: '957', name: 'Brake Drums' },
  ],
  5497: [{ catId: 5497, compId: '12044', name: 'Brake Shoes' }],
  5500: [{ catId: 5500, compId: '957', name: 'Brake Drums' }],
  5506: [{ catId: 5506, compId: '15661', name: 'Handbrake Shoes' }],
  5521: [{ catId: 5524, compId: '814', name: 'Brake Caliper' }],
  5524: [{ catId: 5524, compId: '814', name: 'Brake Caliper' }],
  5527: [{ catId: 5527, compId: '872', name: 'Brake Caliper Repair Kit' }],
  5545: [{ catId: 5545, compId: '963', name: 'Brake Hose' }],
  5548: [{ catId: 5548, compId: '967', name: 'Brake Master Cylinder' }],
  5578: [{ catId: 5581, compId: '838', name: 'Handbrake Cable' }],
  5581: [{ catId: 5581, compId: '838', name: 'Handbrake Cable' }],
  5584: [{ catId: 5587, compId: '815', name: 'Brake Light Switch' }],
  5587: [{ catId: 5587, compId: '815', name: 'Brake Light Switch' }],
  8697: [{ catId: 8697, compId: '868', name: 'ABS Ring' }],

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
  5326: [{ catId: 5326, compId: '808', name: 'Antifreeze & Coolant' }],
  5329: [{ catId: 5329, compId: '22393', name: 'Brake Fluid' }],
  5332: [{ catId: 5332, compId: '22394', name: 'Screen Wash' }],
  5359: [
    { catId: 5362, compId: '854', name: 'Spark Plugs' },
    { catId: 5365, compId: '949', name: 'Glow Plug' },
  ],
  5362: [{ catId: 5362, compId: '854', name: 'Spark Plugs' }],
  5365: [{ catId: 5365, compId: '949', name: 'Glow Plug' }],
  5368: [{ catId: 5371, compId: '873', name: 'Timing Belt' }],
  5371: [{ catId: 5371, compId: '873', name: 'Timing Belt' }],

  // Wiper Blades parent & children
  5389: [
    { catId: 5392, compId: '867', name: 'Wiper Blades' },
    { catId: 5395, compId: '22303', name: 'Wiper Arm' },
    { catId: 5398, compId: '22304', name: 'Washer Jet' },
    { catId: 5401, compId: '22305', name: 'Washer Pump' },
    { catId: 5404, compId: '22306', name: 'Wiper Motor' },
  ],
  5392: [{ catId: 5392, compId: '867', name: 'Wiper Blades' }],
  5395: [{ catId: 5395, compId: '22303', name: 'Wiper Arm' }],
  5398: [{ catId: 5398, compId: '22304', name: 'Washer Jet' }],
  5401: [{ catId: 5401, compId: '22305', name: 'Washer Pump' }],
  5404: [{ catId: 5404, compId: '22306', name: 'Wiper Motor' }],

  // Electrical & Lighting
  5986: [{ catId: 5992, compId: '810', name: 'Car Battery' }],
  5989: [{ catId: 5992, compId: '810', name: 'Car Battery' }],
  5992: [{ catId: 5992, compId: '810', name: 'Car Battery' }],
  6001: [{ catId: 6004, compId: '806', name: 'Alternator' }],
  6004: [{ catId: 6004, compId: '806', name: 'Alternator' }],
  6013: [{ catId: 6016, compId: '12114', name: 'Starter Motor' }],
  6016: [{ catId: 6016, compId: '12114', name: 'Starter Motor' }],
  6019: [{ catId: 6049, compId: '805', name: 'MAF Sensor' }],
  6049: [{ catId: 6049, compId: '805', name: 'MAF Sensor' }],
  6025: [{ catId: 6025, compId: '12093', name: 'Lambda Sensor' }],
  6031: [{ catId: 6031, compId: '15598', name: 'Crankshaft Sensor' }],

  // Engine Parts
  5707: [{ catId: 5713, compId: '873', name: 'Drive Belt' }],
  5710: [{ catId: 5713, compId: '873', name: 'Drive Belt' }],
  5713: [{ catId: 5713, compId: '873', name: 'Drive Belt' }],
  5785: [{ catId: 5788, compId: '15618', name: 'Engine Mount' }],
  5788: [{ catId: 5788, compId: '15618', name: 'Engine Mount' }],

  // Cooling & Heating
  6514: [{ catId: 6547, compId: '808', name: 'Radiator' }],
  6544: [{ catId: 6547, compId: '808', name: 'Radiator' }],
  6547: [{ catId: 6547, compId: '808', name: 'Radiator' }],
  6550: [{ catId: 6550, compId: '15586', name: 'Water Pump' }],
  6553: [{ catId: 6553, compId: '17029', name: 'Thermostat' }],
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
  if (name.includes('wiper arm')) return [{ catId: 5395, compId: '22303', name: 'Wiper Arm' }];
  if (name.includes('washer jet')) return [{ catId: 5398, compId: '22304', name: 'Washer Jet' }];
  if (name.includes('washer pump')) return [{ catId: 5401, compId: '22305', name: 'Washer Pump' }];
  if (name.includes('wiper motor')) return [{ catId: 5404, compId: '22306', name: 'Wiper Motor' }];
  if (name.includes('wiper')) return [{ catId: 5392, compId: '867', name: 'Wiper Blades' }];

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
  if (name.includes('spark')) return [{ catId: 5362, compId: '854', name: 'Spark Plugs' }];
  if (name.includes('glow')) return [{ catId: 5365, compId: '949', name: 'Glow Plug' }];

  // Default fallback for Braking
  return [
    { catId: 5467, compId: '816', name: 'Brake Pads' },
    { catId: 5470, compId: '871', name: 'Brake Discs' },
  ];
}

/**
 * Full Multi-Level Automotive Category Hierarchy Metadata
 * Structured matching authentic gsfcarparts.com:
 * Level 1 Department (Car Parts) -> Level 2 Major Group (Service Parts, Braking) -> Level 3 Subcategory -> Level 4 Leaf (Products)
 */
export const CATEGORY_HIERARCHY_TREE = [
  {
    id: 5275,
    name: 'Car Parts',
    level: 1,
    icon: '🚗',
    tag: 'All Departments',
    desc: 'Explore all automotive replacement parts, service items, and maintenance components.',
    children: [
      // 1. Service Parts (5278)
      {
        id: 5278,
        name: 'Service Parts',
        level: 2,
        parentId: 5275,
        icon: '🔧',
        tag: 'Routine Service',
        desc: 'Oil, air, fuel and pollen filters, premium lubricants, spark plugs and wiper blades.',
        children: [
          // Filters (5281)
          {
            id: 5281,
            name: 'Filters',
            level: 3,
            parentId: 5278,
            icon: '🔧',
            tag: 'Service Kit',
            desc: 'Engine oil filters, engine air filters, cabin pollen filters, and fuel filters.',
            children: [
              { id: 5284, name: 'Oil Filter', compId: '844', level: 4, parentId: 5281, icon: '🛢️', tag: 'Spin-on & Element', desc: 'High efficiency oil filter inserts and spin-on canisters.' },
              { id: 5287, name: 'Air Filter', compId: '804', level: 4, parentId: 5281, icon: '💨', tag: 'High Flow', desc: 'Pleated engine intake air filters for optimal fuel economy.' },
              { id: 5293, name: 'Cabin Filter', compId: '819', level: 4, parentId: 5281, icon: '🍃', tag: 'Active Carbon', desc: 'Pollen and allergen cabin air filters for clean interior air.' },
              { id: 5290, name: 'Fuel Filter', compId: '803', level: 4, parentId: 5281, icon: '⛽', tag: 'Inline Filter', desc: 'Diesel and petrol fuel filters protecting injectors and pumps.' },
            ],
          },
          // Lubricants & Fluids (5320)
          {
            id: 5320,
            name: 'Lubricants & Fluids',
            level: 3,
            parentId: 5278,
            icon: '🛢️',
            tag: 'Approved Specs',
            desc: 'Fully synthetic engine oils (5W-30, 0W-20), coolant, brake fluid and screenwash.',
            children: [
              { id: 5323, name: 'Engine Oil', compId: '17048', level: 4, parentId: 5320, icon: '🛢️', tag: 'Manufacturer Spec', desc: '5W-30, 5W-40, 0W-20 and 0W-30 fully synthetic motor oils.' },
              { id: 5326, name: 'Antifreeze & Coolant', compId: '808', level: 4, parentId: 5320, icon: '❄️', tag: 'G12 / G13 / OAT', desc: 'Engine cooling system antifreeze and pre-mixed coolants.' },
              { id: 5329, name: 'Brake Fluid', compId: '22393', level: 4, parentId: 5320, icon: '💧', tag: 'DOT 4 & DOT 5.1', desc: 'High boiling point synthetic hydraulic brake and clutch fluids.' },
              { id: 5332, name: 'Screen Wash', compId: '22394', level: 4, parentId: 5320, icon: '🚿', tag: 'All Season', desc: 'Concentrated and ready-to-use windscreen washer fluid.' },
            ],
          },
          // Plugs (5359)
          {
            id: 5359,
            name: 'Plugs',
            level: 3,
            parentId: 5278,
            icon: '⚡',
            tag: 'Ignition',
            desc: 'Iridium and platinum spark plugs, ceramic diesel glow plugs.',
            children: [
              { id: 5362, name: 'Spark Plugs', compId: '854', level: 4, parentId: 5359, icon: '⚡', tag: 'Iridium & Laser', desc: 'Petrol engine spark plugs from NGK, Bosch, and Denso.' },
              { id: 5365, name: 'Glow Plug', compId: '949', level: 4, parentId: 5359, icon: '💡', tag: 'Quick Start', desc: 'Diesel cold-start pre-heating glow plugs.' },
            ],
          },
          // Timing Belts (5368)
          {
            id: 5368,
            name: 'Timing Belts',
            level: 3,
            parentId: 5278,
            icon: '🔄',
            tag: 'Engine Timing',
            desc: 'Camshaft timing belts, tensioner pulleys, and complete water pump kits.',
            children: [
              { id: 5371, name: 'Timing Belt', compId: '873', level: 4, parentId: 5368, icon: '🔄', tag: 'Reinforced', desc: 'Heavy duty synchronous toothed camshaft drive belts.' },
            ],
          },
          // Wiper Blades (5389)
          {
            id: 5389,
            name: 'Wiper Blades',
            level: 3,
            parentId: 5278,
            icon: '🌧️',
            tag: 'Clear Vision',
            desc: 'Flat aero beam blades, conventional wiper blades, arms, and washer pumps.',
            children: [
              { id: 5392, name: 'Wiper Blades', compId: '867', level: 4, parentId: 5389, icon: '🌧️', tag: 'Aero Beam', desc: 'Direct-fit front driver, passenger and rear wiper blades.' },
              { id: 5395, name: 'Wiper Arm', compId: '22303', level: 4, parentId: 5389, icon: '🦾', tag: 'Direct Fit', desc: 'Replacement front and rear windscreen wiper arms.' },
              { id: 5398, name: 'Washer Jet', compId: '22304', level: 4, parentId: 5389, icon: '🚿', tag: 'Spray Nozzle', desc: 'Windscreen and headlight washer spray jet nozzles.' },
              { id: 5401, name: 'Washer Pump', compId: '22305', level: 4, parentId: 5389, icon: '💧', tag: '12V Motor', desc: 'Electric windscreen washer fluid reservoir pumps.' },
              { id: 5404, name: 'Wiper Motor', compId: '22306', level: 4, parentId: 5389, icon: '⚙️', tag: 'Drive Motor', desc: 'Front and rear wiper mechanism linkage drive motors.' },
            ],
          },
        ],
      },

      // 2. Braking (5461)
      {
        id: 5461,
        name: 'Braking',
        level: 2,
        parentId: 5275,
        icon: '🛑',
        tag: 'Guaranteed Fit',
        desc: 'High performance brake pads, coated discs, calipers, hydraulics and shoes.',
        children: [
          // Brake Pads & Discs (5464)
          {
            id: 5464,
            name: 'Brake Pads & Discs',
            level: 3,
            parentId: 5461,
            icon: '🛑',
            tag: 'Bestseller',
            desc: 'Replacement front and rear brake pads, discs, wear sensors and fitting kits.',
            children: [
              { id: 5467, name: 'Brake Pads', compId: '816', level: 4, parentId: 5464, icon: '🛑', tag: 'Guaranteed Fit', desc: 'Front & rear brake pads engineered for maximum stopping power and low dust.' },
              { id: 5470, name: 'Brake Discs', compId: '871', level: 4, parentId: 5464, icon: '💿', tag: 'Anti-Corrosion', desc: 'Vented, solid, and coated brake discs for OE fitment and long service life.' },
              { id: 5473, name: 'Brake Pad Wear Sensor', compId: '817', level: 4, parentId: 5464, icon: '🔌', tag: 'Direct Fit', desc: 'Electronic brake pad wear warning sensors for front and rear axles.' },
              { id: 5476, name: 'Brake Pad Fitting Kit', compId: '902', level: 4, parentId: 5464, icon: '🧰', tag: 'Hardware Kit', desc: 'Caliper guide pins, anti-rattle clips, and retaining springs.' },
              { id: 5479, name: 'Brake Pad & Disc Kit', compId: '15654', level: 4, parentId: 5464, icon: '📦', tag: 'Complete Kit', desc: 'Combined axle sets of matched brake pads and discs.' },
            ],
          },
          // Brake Shoes & Drums (5494)
          {
            id: 5494,
            name: 'Brake Shoes & Drums',
            level: 3,
            parentId: 5461,
            icon: '🛞',
            tag: 'Rear Axle',
            desc: 'Drum brake shoes, cast drums, wheel cylinders and handbrake shoes.',
            children: [
              { id: 5497, name: 'Brake Shoes', compId: '12044', level: 4, parentId: 5494, icon: '🛞', tag: 'OE Fit', desc: 'High friction rear brake shoes for drum brake assemblies.' },
              { id: 5500, name: 'Brake Drums', compId: '957', level: 4, parentId: 5494, icon: '🥁', tag: 'Balanced Cast', desc: 'Precision balanced brake drums for smooth rear braking.' },
              { id: 5506, name: 'Handbrake Shoes', compId: '15661', level: 4, parentId: 5494, icon: '🅿️', tag: 'Parking Brake', desc: 'Internal parking and handbrake shoes for disc/drum setups.' },
            ],
          },
          // Brake Hydraulics (5521)
          {
            id: 5521,
            name: 'Brake Hydraulics',
            level: 3,
            parentId: 5461,
            icon: '🗜️',
            tag: 'Hydraulics',
            desc: 'Brake calipers, rebuild kits, hydraulic brake hoses and master cylinders.',
            children: [
              { id: 5524, name: 'Brake Caliper', compId: '814', level: 4, parentId: 5521, icon: '🗜️', tag: 'Brand New', desc: 'Single and multi-piston brake calipers for front and rear axles.' },
              { id: 5527, name: 'Brake Caliper Repair Kit', compId: '872', level: 4, parentId: 5521, icon: '🔧', tag: 'Seals & Pistons', desc: 'Piston seals, dust boots, and guide sleeve repair kits.' },
              { id: 5545, name: 'Brake Hose', compId: '963', level: 4, parentId: 5521, icon: '〰️', tag: 'Flexible Hose', desc: 'Reinforced flexible rubber and braided hydraulic brake lines.' },
              { id: 5548, name: 'Brake Master Cylinder', compId: '967', level: 4, parentId: 5521, icon: '⚙️', tag: 'Tandem Cylinder', desc: 'Primary hydraulic brake master cylinders and fluid reservoirs.' },
            ],
          },
          // Brake Cables (5578)
          {
            id: 5578,
            name: 'Brake Cables',
            level: 3,
            parentId: 5461,
            icon: '⛓️',
            tag: 'Mechanical',
            desc: 'Handbrake cables, front/rear parking brake tension cables.',
            children: [
              { id: 5581, name: 'Handbrake Cable', compId: '838', level: 4, parentId: 5578, icon: '⛓️', tag: 'Tension Cable', desc: 'Sheathed parking brake control cables for rear brakes.' },
            ],
          },
          // Brake Electrical (5584)
          {
            id: 5584,
            name: 'Brake Electrical',
            level: 3,
            parentId: 5461,
            icon: '⚡',
            tag: 'ABS & Sensors',
            desc: 'ABS wheel speed sensors, reluctor rings and brake pedal switches.',
            children: [
              { id: 5587, name: 'Brake Light Switch', compId: '815', level: 4, parentId: 5584, icon: '💡', tag: 'Pedal Switch', desc: 'Stop lamp activation switches mounted at the brake pedal.' },
              { id: 8697, name: 'ABS Ring', compId: '868', level: 4, parentId: 5584, icon: '🛞', tag: 'Reluctor Ring', desc: 'Precision magnetic and toothed ABS wheel speed reluctor rings.' },
            ],
          },
        ],
      },

      // 3. Steering & Suspension (5590)
      {
        id: 5590,
        name: 'Steering & Suspension',
        level: 2,
        parentId: 5275,
        icon: '🏎️',
        tag: 'Chassis & Handling',
        desc: 'Gas shock absorbers, coil springs, control arms, anti-roll links, and steering racks.',
        children: [
          // Shocks & Components (5593)
          {
            id: 5593,
            name: 'Shocks & Components',
            level: 3,
            parentId: 5590,
            icon: '⚙️',
            tag: 'Ride Comfort',
            desc: 'Gas-pressurised shock absorbers, strut cartridges, and top mounts.',
            children: [
              { id: 5596, name: 'Shock Absorber', compId: '870', level: 4, parentId: 5593, icon: '⚙️', tag: 'Gas Strut', desc: 'Front strut units and rear shock absorbers.' },
              { id: 5602, name: 'Strut Top Mount', compId: '21835', level: 4, parentId: 5593, icon: '🔘', tag: 'Top Bearing', desc: 'Upper suspension strut mounts and bearings.' },
            ],
          },
          // Springs & Parts (5614)
          {
            id: 5614,
            name: 'Springs & Parts',
            level: 3,
            parentId: 5590,
            icon: '🌀',
            tag: 'Suspension',
            desc: 'Axle coil springs, suspension bump stops and dust protection kits.',
            children: [
              { id: 5617, name: 'Coil Springs', compId: '21836', level: 4, parentId: 5614, icon: '🌀', tag: 'Matched Pair', desc: 'Standard and sport ride height helical suspension coil springs.' },
            ],
          },
          // Suspension Parts (5629)
          {
            id: 5629,
            name: 'Suspension Parts',
            level: 3,
            parentId: 5590,
            icon: '🔗',
            tag: 'Linkages',
            desc: 'Track control arms, wishbones, anti-roll bar drop links, and ball joints.',
            children: [
              { id: 5632, name: 'Track Control Arm', compId: '857', level: 4, parentId: 5629, icon: '🔗', tag: 'Wishbone', desc: 'Lower and upper front suspension wishbones and bushings.' },
              { id: 5638, name: 'Anti Roll Bar Link', compId: '12065', level: 4, parentId: 5629, icon: '🦯', tag: 'Drop Link', desc: 'Stabiliser anti-roll bar connecting drop links.' },
              { id: 5644, name: 'Ball Joint', compId: '21838', level: 4, parentId: 5629, icon: '⚪', tag: 'Swivel Joint', desc: 'Lower suspension swivel ball joints.' },
            ],
          },
          // Steering Parts (5668)
          {
            id: 5668,
            name: 'Steering Parts',
            level: 3,
            parentId: 5590,
            icon: '🧭',
            tag: 'Steering',
            desc: 'Tie rod track rod ends, inner tie rods, and steering rack gaiters.',
            children: [
              { id: 5671, name: 'Tie Rod End', compId: '12112', level: 4, parentId: 5668, icon: '🧭', tag: 'Track Rod End', desc: 'Outer steering track rod ends for wheel alignment.' },
              { id: 5674, name: 'Tie Rod Assembly', compId: '50000', level: 4, parentId: 5668, icon: '🦯', tag: 'Axial Rod', desc: 'Complete steering tie rod rack ends and boots.' },
            ],
          },
          // Steering Rack (5692)
          {
            id: 5692,
            name: 'Steering Rack',
            level: 3,
            parentId: 5590,
            icon: '🕹️',
            tag: 'Steering Gear',
            desc: 'Manual and hydraulic/electric power-assisted steering gearboxes.',
            children: [
              { id: 5695, name: 'Steering Rack', compId: '50001', level: 4, parentId: 5692, icon: '🕹️', tag: 'Power Steering', desc: 'Remanufactured and brand new power steering gear racks.' },
            ],
          },
        ],
      },

      // 4. Electrical (5986)
      {
        id: 5986,
        name: 'Electrical',
        level: 2,
        parentId: 5275,
        icon: '⚡',
        tag: '12V Power & Sensors',
        desc: 'Car batteries (EFB, AGM, standard lead acid), alternators, starter motors, and engine sensors.',
        children: [
          // Batteries (5989)
          {
            id: 5989,
            name: 'Batteries',
            level: 3,
            parentId: 5986,
            icon: '🔋',
            tag: 'Stop/Start Ready',
            desc: '096, 027, 067 and AGM automotive 12V starter batteries with 3–5 year warranties.',
            children: [
              { id: 5992, name: 'Car Battery', compId: '810', level: 4, parentId: 5989, icon: '🔋', tag: 'Yuasa / Exide', desc: 'High cold cranking amp 12V car and van batteries.' },
            ],
          },
          // Sensors (6019)
          {
            id: 6019,
            name: 'Sensors',
            level: 3,
            parentId: 5986,
            icon: '📡',
            tag: 'Engine Management',
            desc: 'Mass air flow sensors, lambda oxygen sensors, crankshaft and camshaft position sensors.',
            children: [
              { id: 6049, name: 'MAF Sensor', compId: '805', level: 4, parentId: 6019, icon: '💨', tag: 'Air Mass', desc: 'Precision mass airflow intake sensors.' },
              { id: 6025, name: 'Lambda Sensor', compId: '12093', level: 4, parentId: 6019, icon: '🔥', tag: 'Oxygen Sensor', desc: 'Pre and post-cat exhaust gas oxygen lambda sensors.' },
              { id: 6031, name: 'Crankshaft Sensor', compId: '15598', level: 4, parentId: 6019, icon: '🔄', tag: 'RPM Sensor', desc: 'Engine speed and crankshaft position pulse generators.' },
            ],
          },
          // Alternator (6001)
          {
            id: 6001,
            name: 'Alternator',
            level: 3,
            parentId: 5986,
            icon: '⚡',
            tag: 'Charging System',
            desc: '12V high output charging alternators with freewheel pulleys.',
            children: [
              { id: 6004, name: 'Alternator', compId: '806', level: 4, parentId: 6001, icon: '⚡', tag: 'OE Reman', desc: 'Brand new and exchange vehicle charging alternators.' },
            ],
          },
          // Starter System (6013)
          {
            id: 6013,
            name: 'Starter System',
            level: 3,
            parentId: 5986,
            icon: '🔑',
            tag: 'Starting',
            desc: 'Electric starter motors and solenoids for petrol and diesel engines.',
            children: [
              { id: 6016, name: 'Starter Motor', compId: '12114', level: 4, parentId: 6013, icon: '🔑', tag: 'Heavy Duty', desc: 'High torque vehicle starter motors.' },
            ],
          },
        ],
      },

      // 5. Engine Parts (5707)
      {
        id: 5707,
        name: 'Engine Parts',
        level: 2,
        parentId: 5275,
        icon: '⚙️',
        tag: 'Mechanical',
        desc: 'Timing belts, drive belts, cylinder heads, engine mountings, sumps and gaskets.',
        children: [
          {
            id: 5710,
            name: 'Auxilary Drive',
            level: 3,
            parentId: 5707,
            icon: '🔄',
            tag: 'Serpentine',
            desc: 'V-ribbed alternator serpentine belts, tensioners, and idler pulleys.',
            children: [
              { id: 5713, name: 'Drive Belt', compId: '873', level: 4, parentId: 5710, icon: '🔄', tag: 'Poly-V Belt', desc: 'Multi-ribbed auxiliary alternator and air conditioning belts.' },
            ],
          },
          {
            id: 5785,
            name: 'Mountings',
            level: 3,
            parentId: 5707,
            icon: '🛡️',
            tag: 'Damping',
            desc: 'Hydro and rubber engine support mounts and transmission bushes.',
            children: [
              { id: 5788, name: 'Engine Mount', compId: '15618', level: 4, parentId: 5785, icon: '🛡️', tag: 'Hydro Mount', desc: 'Vibration absorbing engine and gearbox mounts.' },
            ],
          },
        ],
      },

      // 6. Cooling & Heating (6514)
      {
        id: 6514,
        name: 'Cooling & Heating',
        level: 2,
        parentId: 5275,
        icon: '❄️',
        tag: 'Thermal',
        desc: 'Engine radiators, water pumps, thermostats, heater matrices and air conditioning parts.',
        children: [
          {
            id: 6544,
            name: 'Cooling System',
            level: 3,
            parentId: 6514,
            icon: '❄️',
            tag: 'Cooling',
            desc: 'Aluminium coolant radiators, mechanical water pumps, and thermostat housings.',
            children: [
              { id: 6547, name: 'Radiator', compId: '808', level: 4, parentId: 6544, icon: '❄️', tag: 'Aluminium Core', desc: 'Engine coolant heat exchanger radiators.' },
              { id: 6550, name: 'Water Pump', compId: '15586', level: 4, parentId: 6544, icon: '💧', tag: 'Metal Impeller', desc: 'Engine coolant circulation water pumps.' },
              { id: 6553, name: 'Thermostat', compId: '17029', level: 4, parentId: 6544, icon: '🌡️', tag: 'Regulator', desc: 'Coolant temperature control thermostat valves.' },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Searches the hierarchical category tree for a category by ID or Name.
 * Priority 1: Exact ID match (searches all levels so leaf categories with matching names never get misidentified)
 * Priority 2: Exact Name match
 * Priority 3: Partial Name match
 *
 * @param {Array<object>} nodes
 * @param {string|number} targetId
 * @param {string} targetName
 * @returns {{ node: object, path: Array<object> } | null}
 */
export function findCategoryNode(nodes, targetId, targetName) {
  const catIdNum = parseInt(targetId, 10);
  const nameNorm = (targetName || '').toLowerCase().trim();

  // 1. Strict ID Search across entire tree
  if (catIdNum && !Number.isNaN(catIdNum)) {
    function searchById(list, path = []) {
      for (const node of list) {
        const currentPath = [...path, node];
        if (node.id === catIdNum) {
          return { node, path: currentPath };
        }
        if (node.children && node.children.length > 0) {
          const res = searchById(node.children, currentPath);
          if (res) return res;
        }
      }
      return null;
    }
    const foundById = searchById(nodes);
    if (foundById) return foundById;
  }

  // 2. Name Search
  if (nameNorm) {
    function searchByName(list, path = [], exact = true) {
      for (const node of list) {
        const currentPath = [...path, node];
        const nodeNameLower = (node.name || '').toLowerCase().trim();
        const matches = exact
          ? nodeNameLower === nameNorm
          : (nodeNameLower.includes(nameNorm) || nameNorm.includes(nodeNameLower));
        if (matches) {
          return { node, path: currentPath };
        }
        if (node.children && node.children.length > 0) {
          const res = searchByName(node.children, currentPath, exact);
          if (res) return res;
        }
      }
      return null;
    }
    const foundExact = searchByName(nodes, [], true);
    if (foundExact) return foundExact;

    const foundPartial = searchByName(nodes, [], false);
    if (foundPartial) return foundPartial;
  }

  return null;
}

/**
 * Resolves breadcrumb path, subcategories, and nested groups for any category ID or name.
 * Determines:
 * - isLeaf: true if node has no children (Product List PLP mode)
 * - hasNestedGroups: true if direct children have their own children (Section Headings mode)
 *
 * @param {string|number} categoryId
 * @param {string} [categoryName]
 * @returns {{
 *   level: number,
 *   isLeaf: boolean,
 *   hasNestedGroups: boolean,
 *   current: { id: number, name: string, level: number, icon?: string, tag?: string, desc?: string, compId?: string },
 *   breadcrumbs: Array<{ name: string, href: string }>,
 *   children: Array<{ id: number, name: string, href: string, icon?: string, tag?: string, desc?: string, compId?: string, hasChildren: boolean }>,
 *   subcategories: Array<{ id: number, name: string, href: string, icon?: string, tag?: string, desc?: string, compId?: string, hasChildren: boolean }>,
 *   groups: Array<{ id: number, name: string, icon: string, tag: string, desc: string, href: string, items: Array<object> }>,
 *   siblings: Array<{ id: number, name: string, href: string, active?: boolean }>,
 *   quickLeaves: Array<{ id: number, name: string, href: string }>
 * }}
 */
export function getCategoryNavInfo(categoryId = '', categoryName = '') {
  const result = findCategoryNode(CATEGORY_HIERARCHY_TREE, categoryId, categoryName);

  if (!result) {
    const catIdNum = parseInt(categoryId, 10);
    const displayName = categoryName || (catIdNum ? `Category ${catIdNum}` : 'All Parts');
    const isKnownParent = displayName.toLowerCase().includes('braking')
      || displayName.toLowerCase().includes('service')
      || displayName.toLowerCase().includes('parts');

    return {
      level: isKnownParent ? 1 : 3,
      isLeaf: !isKnownParent,
      hasNestedGroups: false,
      current: { id: catIdNum || 5275, name: displayName, level: isKnownParent ? 1 : 3 },
      breadcrumbs: [
        { name: 'Home', href: '/' },
        { name: displayName, href: `/plp.html?category_id=${categoryId}&category_name=${encodeURIComponent(displayName)}` },
      ],
      children: [],
      subcategories: [],
      groups: [],
      siblings: [],
      quickLeaves: [],
    };
  }

  const { node, path } = result;
  const isLeaf = !node.children || node.children.length === 0;
  const hasNestedGroups = Boolean(node.children && node.children.some((c) => c.children && c.children.length > 0));

  // Breadcrumbs path from root to current node
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    ...path.map((p) => ({
      name: p.name,
      href: `/plp.html?category_id=${p.id}&category_name=${encodeURIComponent(p.name)}`,
    })),
  ];

  // Direct children formatted for rendering
  const formattedChildren = (node.children || []).map((c) => ({
    id: c.id,
    name: c.name,
    href: `/plp.html?category_id=${c.id}&category_name=${encodeURIComponent(c.name)}`,
    icon: c.icon || node.icon || '📦',
    tag: c.tag || 'Guaranteed Fit',
    desc: c.desc || `Browse genuine and OEM ${c.name} parts`,
    compId: c.compId,
    hasChildren: Boolean(c.children && c.children.length > 0),
    children: c.children || [],
  }));

  // Groups for Rule 1: Multi-level categories render direct subcategories as SECTION HEADINGS with cards inside
  const groups = hasNestedGroups
    ? (node.children || []).map((group) => ({
      id: group.id,
      name: group.name,
      icon: group.icon || node.icon || '📦',
      tag: group.tag || 'Category',
      desc: group.desc || `Browse all ${group.name} components`,
      href: `/plp.html?category_id=${group.id}&category_name=${encodeURIComponent(group.name)}`,
      items: (group.children || []).map((item) => ({
        id: item.id,
        name: item.name,
        href: `/plp.html?category_id=${item.id}&category_name=${encodeURIComponent(item.name)}`,
        icon: item.icon || group.icon || '📦',
        tag: item.tag || 'Guaranteed Fit',
        desc: item.desc || `Shop ${item.name} for your vehicle`,
        compId: item.compId,
        hasChildren: Boolean(item.children && item.children.length > 0),
      })),
    }))
    : [];

  // Siblings: if node has a parent in path, parent's children are the siblings
  let siblings = [];
  if (path.length > 1) {
    const parent = path[path.length - 2];
    siblings = (parent.children || []).map((s) => ({
      id: s.id,
      name: s.name,
      href: `/plp.html?category_id=${s.id}&category_name=${encodeURIComponent(s.name)}`,
      active: s.id === node.id,
    }));
  }

  // Quick leaves under this node or its parent
  const allLeaves = [];
  function collectLeaves(curr) {
    if (!curr.children || curr.children.length === 0) {
      allLeaves.push(curr);
    } else {
      curr.children.forEach(collectLeaves);
    }
  }
  collectLeaves(node);

  return {
    level: path.length,
    isLeaf,
    hasNestedGroups,
    current: {
      id: node.id,
      name: node.name,
      level: path.length,
      icon: node.icon,
      tag: node.tag,
      desc: node.desc,
      compId: node.compId,
    },
    breadcrumbs,
    children: formattedChildren,
    subcategories: formattedChildren,
    groups,
    siblings,
    quickLeaves: allLeaves.slice(0, 8).map((l) => ({
      id: l.id,
      name: l.name,
      href: `/plp.html?category_id=${l.id}&category_name=${encodeURIComponent(l.name)}`,
    })),
  };
}

export default resolveCategoryComponentIds;

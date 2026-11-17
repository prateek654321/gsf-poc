/**
 * Mapping and resolution utility to map Magento categories to automotive Component IDs
 * This ensures the fitment API and catalog queries return only products matching
 * the active category based on component IDs.
 */

// Category ID / Slug to Component IDs dictionary
export const KNOWN_CATEGORY_COMPONENT_MAP = {
  // Service Parts & Maintenance
  5278: [804, 819, 17001, 810, 5359, 5389, 15631], // Service Parts
  5281: [804, 819, 17001, 22091], // Filters
  5299: [816, 871, 814, 817, 872], // Brake Pads & Discs in Service
  5320: [22393, 22394, 22404, 808], // Oils & Lubricants
  5359: [5359, 15419], // Plugs & Glow Plugs
  5368: [5368, 873], // Timing Belts
  5389: [5389, 22303], // Wiper Blades
  5413: [15631, 16903, 22281], // Bulbs

  // Braking
  5461: [814, 816, 817, 838, 868, 871, 872, 902, 927, 957, 963, 967, 968, 12044, 12094, 15654, 15712, 16982, 16983, 16984, 17021, 17023], // Braking
  5464: [814, 816, 817, 871, 872, 902, 927, 15654, 17023], // Brake Pads & Discs
  5494: [12044, 957], // Brake Shoes & Drums
  5521: [963, 967, 12094, 12109, 15585, 16983], // Brake Hydraulics
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

export default resolveCategoryComponentIds;

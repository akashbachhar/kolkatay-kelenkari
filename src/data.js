// Real-world layout of north & central Kolkata. Everything is placed from lat/lon.
// Distances are compressed (S) so the city is walkable; landmarks keep near-real size.
export const LAT0 = 22.564, LON0 = 88.35, S = 0.45;
export const ll = (lat, lon) => [(lon - LON0) * 102800 * S, -(lat - LAT0) * 110600 * S];
const L = a => a.map(p => ll(p[0], p[1]));
export const X0 = -1280, X1 = 1300, Z0 = -1380, Z1 = 1260;

// East bank of the Hooghly (north -> south)
export const BANK = L([[22.593, 88.3503], [22.5846, 88.3482], [22.578, 88.3455], [22.57, 88.3415], [22.562, 88.3355], [22.556, 88.3305], [22.548, 88.329], [22.538, 88.329]]);
export const RIVER_W = 208, WATER_Y = -6;
export function bankX(z) {
  for (let i = 0; i < BANK.length - 1; i++) {
    const a = BANK[i], b = BANK[i + 1];
    if (z <= b[1] || i === BANK.length - 2) return a[0] + (b[0] - a[0]) * Math.min(1.2, Math.max(-.2, (z - a[1]) / (b[1] - a[1])));
  }
}

const bz = ll(22.585, 0)[1], nn = Math.hypot(.975, .22), dx = -.975 / nn, dz = -.22 / nn;
// Howrah Bridge: starts 45 units inland (anchor arm), crosses the river heading west
export const BRIDGE = { x: bankX(bz) - dx * 45, z: bz - dz * 45, dx, dz, L: 295, ry: Math.atan2(-dz, dx), end: 262 };

export const ROADS = [
  ['Chowringhee Road', 20, [[22.5645, 88.3509], [22.56, 88.3506], [22.5545, 88.3508], [22.549, 88.3492], [22.545, 88.3474], [22.5413, 88.3462]]],
  ['Chittaranjan Avenue', 20, [[22.5645, 88.3511], [22.5676, 88.3555], [22.5726, 88.3585], [22.581, 88.361], [22.5857, 88.3622], [22.5905, 88.3636]]],
  ['College Street', 14, [[22.57, 88.3626], [22.5783, 88.3641]]],
  ['Bidhan Sarani', 14, [[22.5783, 88.3641], [22.5905, 88.3665]]],
  ['Nirmal Chandra Street', 14, [[22.5652, 88.359], [22.57, 88.3626]]],
  ['Mahatma Gandhi Road', 16, [[22.5848, 88.3493], [22.5826, 88.3545], [22.5808, 88.361], [22.5783, 88.3641], [22.5725, 88.3701]]],
  ['B.B. Ganguly Street, Bowbazar', 14, [[22.5712, 88.351], [22.5712, 88.3577], [22.57, 88.3626], [22.5682, 88.3699]]],
  ['Lenin Sarani', 14, [[22.5645, 88.3511], [22.5652, 88.359], [22.5642, 88.369]]],
  ['S.N. Banerjee Road', 12, [[22.5632, 88.3508], [22.5632, 88.3545], [22.5625, 88.3689]]],
  ['Lindsay Street', 10, [[22.5602, 88.3506], [22.5602, 88.3547]]],
  ['Free School Street', 10, [[22.5632, 88.3545], [22.5602, 88.3547], [22.5528, 88.354]]],
  ['Park Street', 16, [[22.5545, 88.3508], [22.551, 88.3575], [22.5462, 88.3655]]],
  ['Rafi Ahmed Kidwai Road', 12, [[22.5652, 88.359], [22.56, 88.3582], [22.551, 88.3575]]],
  ['A.J.C. Bose Road', 20, [[22.544, 88.3312], [22.542, 88.34], [22.5413, 88.3462], [22.5425, 88.356], [22.5462, 88.3655], [22.556, 88.368], [22.5642, 88.369], [22.5682, 88.3699], [22.5725, 88.3701]]],
  ['A.P.C. Road', 20, [[22.5725, 88.3701], [22.58, 88.3712], [22.5905, 88.3722]]],
  ['Strand Road', 14, [[22.5848, 88.3493], [22.578, 88.3468], [22.57, 88.3428], [22.562, 88.3371], [22.556, 88.3323], [22.548, 88.3308], [22.544, 88.3312]]],
  ['Red Road', 22, [[22.5658, 88.3478], [22.56, 88.3462], [22.554, 88.3447], [22.5478, 88.344]]],
  ['Esplanade Row', 14, [[22.5645, 88.3509], [22.566, 88.3478], [22.5666, 88.344], [22.5672, 88.3414]]],
  ["Queen's Way", 14, [[22.548, 88.3308], [22.5478, 88.3385], [22.5478, 88.344], [22.5474, 88.3485]]],
  ['Old Court House Street', 12, [[22.5735, 88.351], [22.5712, 88.351], [22.5662, 88.35], [22.5649, 88.3501]]],
  ['Council House Street', 10, [[22.5735, 88.3482], [22.5712, 88.3481], [22.569, 88.3462], [22.5664, 88.3456]]],
  ['B.B.D. Bagh North', 10, [[22.5735, 88.3482], [22.5735, 88.351]]],
  ['B.B.D. Bagh South', 10, [[22.5712, 88.3481], [22.5712, 88.351]]],
  ['Brabourne Road', 14, [[22.5735, 88.351], [22.58, 88.3506], [22.5848, 88.3493]]],
  ['Rabindra Sarani', 10, [[22.5712, 88.3545], [22.5772, 88.3553], [22.5857, 88.3585], [22.5905, 88.3592]]],
].map(([n, w, p]) => ({ n, w, p: L(p) }));

// Esplanade - Lenin Sarani - College Street - Bidhan Sarani tram line
export const TRAM = L([[22.5645, 88.3511], [22.5652, 88.359], [22.57, 88.3626], [22.5783, 88.3641], [22.5905, 88.3665]]);

export const MAIDAN = L([[22.5645, 88.3509], [22.56, 88.3506], [22.5545, 88.3508], [22.549, 88.3492], [22.545, 88.3474], [22.5413, 88.3462], [22.542, 88.34], [22.544, 88.3312], [22.548, 88.3308], [22.556, 88.3323], [22.562, 88.3371], [22.5672, 88.3408], [22.5672, 88.3414], [22.5666, 88.344], [22.566, 88.3478]]);

export const AREAS = [['Esplanade', 22.564, 88.351], ['Maidan', 22.557, 88.345], ['Maidan', 22.551, 88.342], ['B.B.D. Bagh', 22.5725, 88.3495], ['Burrabazar', 22.581, 88.353], ['Posta', 22.587, 88.352], ['College Street · Boi Para', 22.5755, 88.3635], ['Sealdah', 22.568, 88.3695], ['Park Street', 22.551, 88.357], ['Chowringhee', 22.5575, 88.3515], ['New Market', 22.5605, 88.353], ['Bowbazar', 22.5705, 88.359], ['Jorasanko', 22.585, 88.36], ['Hastings', 22.546, 88.3335], ['Taltala', 22.5595, 88.363], ['Dharmatala', 22.5645, 88.356], ['Chandni Chowk', 22.5675, 88.355], ['Rabindra Sadan', 22.5425, 88.347], ['Entally', 22.555, 88.369], ['Strand · Hooghly riverfront', 22.568, 88.341], ['Kolutola', 22.5765, 88.359], ['Amherst Street', 22.578, 88.368], ['Girish Park', 22.587, 88.3635], ['Dalhousie', 22.569, 88.345], ['Wellesley', 22.553, 88.362], ['Camac Street', 22.545, 88.354]].map(([n, a, b]) => ({ n, p: ll(a, b) }));

// Kolkata Police: officer posts (filled in as the city is built), the release point outside Lalbazar, the uniform
export const COPS = { posts: [], hq: null, look: { top: '#f5f5f1', bottom: '#f1f1ec', shoe: '#111111', hair: '#111111', cap: '#1b2a55', full: true, skin: '#8d5a3b' } };
// bus routes that start or end at Esplanade (Dharmatala): [number, far end, far end in Bengali]
export const BUS_ROUTES = [['D28B', 'ESPLANADE', 'ধর্মতলা'], ['43', 'DAKSHINESWAR', 'দক্ষিণেশ্বর'], ['34B', 'DUNLOP', 'ডানলপ'], ['46', 'AIRPORT', 'এয়ারপোর্ট'], ['46B', 'MOONBEAM', 'মুনবিম'], ['34C', 'NOAPARA', 'নোয়াপাড়া'],
  ['30A', 'SINTHEE', 'সিঁথি'], ['214A', 'SODEPUR', 'সোদপুর'], ['RT-18', 'KONA MORE', 'কোনা মোড়'], ['RT-11', 'BELUR MATH', 'বেলুড় মঠ'], ['RT-3', 'KADAMTALA', 'কদমতলা'], ['12 SHUTTLE', 'BADARTALA', 'বাদারতলা']];
export const PARKED = []; // vehicles standing at the bus terminus and taxi stand: {k, x, z, a, route}
export const SPAWN = [-8, 41.6]; // at the north end of the Dharmatala bus stand, by the Esplanade metro

// Dakshineswar: a separate area upriver, reached by ferry from Babughat
export const DAK = (() => { const z = -2950, bx = bankX(z); return { z, bx, x0: bx + 1.2, x1: bx + 236, z0: z - 215, z1: z + 215 }; })();
AREAS.push({ n: 'Dakshineswar', p: [DAK.bx + 80, DAK.z] });

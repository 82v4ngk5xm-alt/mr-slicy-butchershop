export const GAME = {
  width: 960,
  height: 540,
  speed: {
    player: 145,
    sprint: 210,
    hunter: 88,
  },
  colors: {
    wall: 0x2e1f2f,
    floor: 0x453245,
    crate: 0x7d5a42,
    player: 0x7ad3ff,
    hunter: 0xe35d6a,
    oldMan: 0xd1d18f,
    key: 0xf8d66d,
    lock: 0x89f0aa,
    switchOff: 0x7a707a,
    switchOn: 0x9af7d8,
    exitClosed: 0x4b1f1f,
    exitOpen: 0x4ba67d,
  },
};

export const DELIVERIES = [
  {
    id: 1,
    title: "Delivery 1: Warm Knocking",
    intro:
      "The old man smiles without blinking. 'Just drop it by the freezer, kid.'",
    hunterSpeedBoost: 0,
    requiredSwitches: 1,
    hasFakeNoise: false,
  },
  {
    id: 2,
    title: "Delivery 2: Extra Cuts",
    intro:
      "The meat hooks sway. No wind. The old man whispers, 'Faster this time.'",
    hunterSpeedBoost: 18,
    requiredSwitches: 2,
    hasFakeNoise: true,
  },
  {
    id: 3,
    title: "Delivery 3: Closing Time",
    intro:
      "Something inside the freezer knocks back. The old man is suddenly gone.",
    hunterSpeedBoost: 35,
    requiredSwitches: 3,
    hasFakeNoise: true,
  },
];

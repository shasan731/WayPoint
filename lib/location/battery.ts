export type BatterySnapshot = {
  batteryLevel: number | null;
  isCharging: boolean | null;
};

type BatteryManagerLike = {
  level: number;
  charging: boolean;
};

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

export async function getBatterySnapshot(): Promise<BatterySnapshot> {
  const navigatorWithBattery = navigator as NavigatorWithBattery;

  if (!navigatorWithBattery.getBattery) {
    return { batteryLevel: null, isCharging: null };
  }

  try {
    const battery = await navigatorWithBattery.getBattery();
    return {
      batteryLevel: Math.round(battery.level * 100),
      isCharging: battery.charging
    };
  } catch {
    return { batteryLevel: null, isCharging: null };
  }
}

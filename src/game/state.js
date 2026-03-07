export const runState = {
  currentDeliveryIndex: 0,
  completedDeliveries: 0,

  reset() {
    this.currentDeliveryIndex = 0;
    this.completedDeliveries = 0;
  },

  startNextDelivery() {
    this.currentDeliveryIndex += 1;
  },
};

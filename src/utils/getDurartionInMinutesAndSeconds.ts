export const getDurartionInMinutesAndSeconds = (ticks: number): [number, number] => {
  const totalSeconds = Math.floor(ticks / 10000000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return [minutes, seconds];
};
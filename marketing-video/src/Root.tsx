import { Composition } from "remotion";
import { Pitch } from "./Pitch";
import timings from "./timings.json";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Pitch"
      component={Pitch}
      durationInFrames={Math.ceil((timings.totalDuration + 1.2) * FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};

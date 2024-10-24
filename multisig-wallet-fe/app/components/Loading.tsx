import React from "react";
import { ThreeCircles } from "react-loader-spinner";
export const Loading = () => {
  return (
    <div className="fixed top-0 left-0 flex items-center justify-center w-full h-screen">
      <div className="absolute z-[200]">
        <ThreeCircles
          visible={true}
          height="100"
          width="100"
          color="#FEE505"
          ariaLabel="three-circles-loading"
        />
      </div>
      <div className="absolute z-10 w-screen h-screen bg-black bg-opacity-60"></div>
    </div>
  );
};

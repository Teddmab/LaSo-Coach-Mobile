import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const AgoraIcon = ({ width = 22, height = 20, color = '#000000', ...props }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 22 20" fill="none" {...props}>
      <Path 
        d="M17.1665 5.87839V7.26999C17.1665 8.09842 16.4949 8.76999 15.6665 8.76999H6.3335C5.50507 8.76999 4.8335 8.09842 4.8335 7.26999V5.87839H17.1665Z" 
        stroke={color}
      />
      <Rect x="5.94434" y="8.79727" width="10.1111" height="9.7027" stroke={color} />
      <Path d="M3.22223 18.5135H18.7778" stroke={color} strokeLinecap="round" />
      <Path d="M9.3335 11.2162L9.3335 16.0811" stroke={color} strokeLinecap="round" />
      <Path d="M12.6665 11.2162L12.6665 16.0811" stroke={color} strokeLinecap="round" />
      <Path 
        d="M11 1H3.53968C2.13705 1 1 2.08904 1 3.43243C1 4.77583 2.13705 5.86486 3.53968 5.86486C4.09981 5.86486 4.36572 5.72694 4.57859 5.49757C5.13532 4.89771 4.78731 3.65586 4 3.43243V3.43243" 
        stroke={color}
      />
      <Path 
        d="M11 1H18.4603C19.8629 1 21 2.08904 21 3.43243C21 4.77583 19.8629 5.86486 18.4603 5.86486C17.9002 5.86486 17.6343 5.72694 17.4214 5.49757C16.8647 4.89771 17.2127 3.65586 18 3.43243V3.43243" 
        stroke={color}
      />
    </Svg>
  );
};

export default AgoraIcon; 
import { unsplashSource } from './unsplash';
import { duckduckgoSource } from './duckduckgo';
import { sogouSource } from './sogou';
import { doutulaSource } from './doutula';
import { adoutuSource } from './adoutu';
import { doutuSource } from './doutu';
import { fabiaoqingSource } from './fabiaoqing';
import { doutubaSource } from './doutuba';
import { doutuwangSource } from './doutuwang';
import { qudoutuSource } from './qudoutu';
import { biaoqing2333Source } from './biaoqing2333';
import { dbbqbSource } from './dbbqb';
import { baiduSource } from './baidu';
import { doulegetuSource } from './doulegetu';

export const sources = [
  unsplashSource,
  duckduckgoSource,
  sogouSource,
  doutulaSource,
  adoutuSource,
  doutuSource,
  fabiaoqingSource,
  doutubaSource,
  doutuwangSource,
  qudoutuSource,
  biaoqing2333Source,
  dbbqbSource,
  baiduSource,
  doulegetuSource,
];

export const getSource = (name) => {
    return sources.find(s => s.name === name);
}
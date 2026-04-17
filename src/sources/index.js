import { sourceRepository } from '../core/SourceRepository.js';

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

// 所有图源适配器
const sourceDefinitions = [
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

// 批量注册图源
sourceRepository.registerAll(sourceDefinitions);

// 兼容旧API
export const sources = sourceRepository.getAll();
export const getSource = (name) => sourceRepository.get(name);

export default sourceRepository;

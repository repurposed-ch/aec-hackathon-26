import { ListingTypes } from './elements';

import bricksIcon from '/assets/icons/element-typology/bricks.svg';
import woodIcon from '/assets/icons/element-typology/wood.svg';
import windowIcon from '/assets/icons/element-typology/window.svg';
import tileIcon from '/assets/icons/element-typology/tile.svg';
import doorIcon from '/assets/icons/element-typology/door.svg';

export const TYPE_ICONS: Record<(typeof ListingTypes)[number], string> = {
  bricks: bricksIcon.src,
  wood: woodIcon.src,
  window: windowIcon.src,
  tile: tileIcon.src,
  door: doorIcon.src
};

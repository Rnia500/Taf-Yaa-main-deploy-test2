import * as spouses from "./addspouses";
import * as children from "./addChild";
import * as parents from "./parents";
import * as marriages from "./marriages";
import * as events from "./events";
import * as stories from "./stories";

const treeController = {
  ...spouses,
  ...children,
  ...parents,
  ...marriages,
  ...events,
  ...stories,
};

export default treeController;


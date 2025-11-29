export { formatRegistry } from "./registry";
export { openDriveFormat } from "./opendrive";

// 注册内置格式
import { formatRegistry } from "./registry";
import { openDriveFormat } from "./opendrive";

formatRegistry.register(openDriveFormat);

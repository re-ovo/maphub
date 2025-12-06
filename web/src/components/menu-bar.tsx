import { ThemeSwitch } from "@/components/theme-switch";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useStore } from "@/store";

export function MenuBar() {
  const { resetLayout } = useStore();
  const exportGLB = useStore((s) => s.exportGLB);

  return (
    <div className="flex items-center border-b px-4 py-1 bg-background gap-2">
      {/* 左侧标题 */}
      <div className="font-bold text-sm flex items-center gap-2">
        <img src="/icon.svg" alt="MapHub" className="w-6 h-6" />
        MapHub
      </div>

      {/* 左侧菜单 */}
      <Menubar className="border-none shadow-none">
        <MenubarMenu>
          <MenubarTrigger>文件</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>打开</MenubarItem>
            <MenubarItem onClick={exportGLB}>导出为 GLB</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>视图</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={resetLayout}>重置布局</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>帮助</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>关于</MenubarItem>
            <MenubarItem asChild>
              <a href="https://github.com/re-ovo/" target="_blank">
                Github
              </a>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* 右侧主题切换 */}
      <ThemeSwitch className="ml-auto" />
    </div>
  );
}

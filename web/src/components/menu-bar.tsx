import { AboutDialog } from "@/components/about-dialog";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useStore } from "@/store";
import { useRef, useState } from "react";

export function MenuBar() {
  const { resetLayout } = useStore();
  const exportGLB = useStore((s) => s.exportGLB);
  const loadFiles = useStore((s) => s.loadFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadFiles(Array.from(files));
    }
    // 重置 input，以便可以再次选择同一文件
    e.target.value = "";
  };

  const handleLoadExample = async () => {
    const response = await fetch("/xodr/default.xodr");
    const blob = await response.blob();
    const file = new File([blob], "default.xodr", { type: "application/xml" });
    loadFiles([file]);
  };

  return (
    <div className="flex items-center border-b px-4 py-1 bg-background gap-2">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xodr,.xml,.bin"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 左侧标题 */}
      <div className="font-bold text-sm flex flex-row items-center gap-2">
        <img src="/icon.svg" alt="MapHub" className="w-6 h-6" />
        <h1>MapHub</h1>
      </div>

      {/* 左侧菜单 */}
      <Menubar className="border-none shadow-none [app-region:no-drag]">
        <MenubarMenu>
          <MenubarTrigger>文件</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleOpenClick}>打开</MenubarItem>
            <MenubarItem onClick={handleLoadExample}>加载示例地图</MenubarItem>
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
            <MenubarItem onClick={() => setShowAboutDialog(true)}>
              关于
            </MenubarItem>
            <MenubarItem asChild>
              <a href="https://github.com/re-ovo/" target="_blank">
                Github
              </a>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* 右侧主题切换 */}
      <div className="flex flex-row items-center gap-4 ml-auto [app-region:no-drag]">
        <span className="text-xs text-muted-foreground font-normal leading-none">
          {__GIT_HASH__}
        </span>
        <ThemeSwitch />
      </div>

      {/* 关于对话框 */}
      <AboutDialog
        open={showAboutDialog}
        onOpenChange={setShowAboutDialog}
      />
    </div>
  );
}

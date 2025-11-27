import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { ThemeSwitch } from "@/components/theme-switch"

export function MenuBar() {
  return (
    <div className="flex items-center justify-between border-b px-4 py-1 bg-background">
      {/* 左侧菜单 */}
      <Menubar className="border-none shadow-none">
        <MenubarMenu>
          <MenubarTrigger>文件</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              打开 <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              保存 <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              退出 <MenubarShortcut>⌘Q</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>编辑</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              撤销 <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              重做 <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              剪切 <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              复制 <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              粘贴 <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>视图</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>全屏</MenubarItem>
            <MenubarItem>缩放</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>显示网格</MenubarItem>
            <MenubarItem>显示坐标轴</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>帮助</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>文档</MenubarItem>
            <MenubarItem>关于</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* 右侧主题切换 */}
      <ThemeSwitch />
    </div>
  )
}

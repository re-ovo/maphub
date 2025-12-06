import { MenuBar } from "./components/menu-bar";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import Panels from "./viewer/panels";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <div className="h-screen w-screen flex flex-col">
        <header
          className="[app-region:drag]"
          style={{
            paddingLeft: "env(titlebar-area-x, 0)",
            paddingTop: "env(titlebar-area-y, 0)",
            width: "env(titlebar-area-width, 100%)",
          }}
        >
          <MenuBar />
        </header>
        <main className="flex-1">
          <Panels />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;

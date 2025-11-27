import { MenuBar } from "./components/menu-bar";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import Viewer from "./viewer/viewer";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <div className="h-screen w-screen flex flex-col">
        <header>
          <MenuBar />
        </header>
        <main className="flex-1">
          <Viewer />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;

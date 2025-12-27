import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { router } from "./router";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
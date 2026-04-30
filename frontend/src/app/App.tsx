import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { Providers } from "./providers";
import "../styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  );
}

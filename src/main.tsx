import ReactDOM from 'react-dom/client'
import UploadPage from './pages/Upload.page'
import NotFoundPage from './pages/NotFound.page'
import './main.scss'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <UploadPage />,
  },

  {
    path: "/404",
    element: <NotFoundPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <RouterProvider router={router} />
  // </React.StrictMode>,
)

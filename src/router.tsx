import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import HomePage from "./routes/home";
import AboutPage from "./routes/about";
import ServicesPage from "./routes/services";
import ContactPage from "./routes/contact";
import NotFoundPage from "./routes/not-found";
import FormGenerator from "./routes/form/form-generator";
import FormList from "./routes/form/form-list";
import SubmitForm from "./routes/form/submit-form";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "services",
        element: <ServicesPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: "/form",
    element: <Layout />,
    children: [
      {
        path: "generator",
        element: <FormGenerator/>
      },
       {
        path: "submit/:id",
        element: <SubmitForm/>
      },
      {
        index: true,
        path: "",
        element: <FormList/>
      }
    ]
  }
]);
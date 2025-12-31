// In your router configuration file
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
import EditForm from "./routes/form/edit-form";
import ResponsesIndex from "./routes/response/responses-index";
import EditResponse from "./routes/response/edit-response";
import ShowResponse from "./routes/response/show-response";
import LoginPage from "./routes/login";

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
    path: "/auth",
    element: <Layout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/form",
    element: <Layout />,
    children: [
      {
        path: "generator",
        element: <FormGenerator />,
      },
      {
        path: "submit/:id",
        element: <SubmitForm />,
      },
      {
        index: true,
        path: "",
        element: <FormList />,
      },
      {
        path: "edit/:formId",
        element: <EditForm />,
      },
      {
        path: ":formId/responses",
        element: <ResponsesIndex />,
      },
      {
        path: ":formId/responses/show/:responseId", // Add this route
        element: <ShowResponse />,
      },
      {
        path: ":formId/responses/edit/:responseId",
        element: <EditResponse />,
      },
    ],
  },
]);

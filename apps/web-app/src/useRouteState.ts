import { useEffect, useState } from "react";

import {
  AppRoute,
  getRouteContext,
  resolveRoute,
  RouteContext,
} from "./routeConfig";

type UseRouteStateResult = {
  activeRoute: AppRoute;
  routeContext: RouteContext;
  navigate: (path: AppRoute) => void;
};

const useRouteState = (): UseRouteStateResult => {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() =>
    resolveRoute(window.location.pathname),
  );
  const routeContext = getRouteContext(activeRoute);

  useEffect(() => {
    const syncRoute = () => {
      setActiveRoute((prev) => {
        const next = resolveRoute(window.location.pathname);
        return prev === next ? prev : next;
      });
    };

    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  const navigate = (path: AppRoute) => {
    const next = resolveRoute(path);
    if (next === activeRoute) {
      return;
    }

    window.history.pushState({}, "", next);
    setActiveRoute(next);
  };

  return {
    activeRoute,
    routeContext,
    navigate,
  };
};

export { useRouteState };

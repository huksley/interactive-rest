import { useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate, useMatch } from "react-router-dom";
import queryString from "query-string";

// Hook https://usehooks.com/useRouter/
export function useRouter() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Return our custom router object
  // Memoize so that a new object is only returned if something changes
  return useMemo(
    () => ({
      // For convenience add push(), replace(), pathname at top level
      push: (path) => navigate(path),
      replace: (path) => navigate(path, { replace: true }),
      pathname: location.pathname,
      // Merge params and parsed query string into single "query" object
      // so that they can be used interchangeably.
      // Example: /:topic?sort=popular -> { topic: "react", sort: "popular" }
      query: {
        ...queryString.parse(location.search), // Convert string to object
        ...params,
      },
      // Include location, history objects so we have
      // access to extra React Router functionality if needed.
      location,
      history,
    }),
    [params, location, history]
  );
}

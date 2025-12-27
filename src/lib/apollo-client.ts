import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Get your Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_GRAPH_QL_API;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const httpLink = createHttpLink({
  uri: `${supabaseUrl}/graphql/v1`,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
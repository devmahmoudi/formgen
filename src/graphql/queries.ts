import { gql } from '@apollo/client';

export const GET_FORMS = gql`
  query GetForms {
    formsCollection {
      edges {
        node {
          id
          title
          description
          schema
          created_at
          updated_at
        }
      }
    }
  }
`;

export const CREATE_FORM = gql`
  mutation CreateForm($objects: [formsInsertInput!]!) {
    insertIntoformsCollection(objects: $objects) {
      records {
        id
        title
        description
        schema
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_FORM = gql`
  mutation DeleteForm($id: uuid!) {
    deleteFromformsCollection(
      filter: { id: { eq: $id } }
      atMost: 1
    ) {
      records {
        id
      }
    }
  }
`;
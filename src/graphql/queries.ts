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

export const GET_FORM_BY_ID = gql`
  query GetFormById($id: uuid!) {
    formsCollection(filter: { id: { eq: $id } }) {
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

export const SUBMIT_FORM_RESPONSE = gql`
  mutation SubmitFormResponse($objects: [form_submissionsInsertInput!]!) {
    insertIntorowsCollection(objects: $objects) {
      records {
        id
        form_id
        data
        created_at
      }
    }
  }
`;
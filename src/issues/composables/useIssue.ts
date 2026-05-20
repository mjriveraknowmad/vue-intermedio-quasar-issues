import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Issue } from '../interfaces/issue';
import { githubApi } from '../../api/githubApi';

const sleep = (): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2000);
  });
};

const getIssue = async (issueNumber: number): Promise<Issue> => {
  await sleep();

  const { data } = await githubApi.get<Issue>(`/issues/${issueNumber}`);
  return data;
};

const getIssueComments = async (issueNumber: number): Promise<Issue[]> => {
  await sleep();

  const { data } = await githubApi.get<Issue[]>(
    `/issues/${issueNumber}/comments`
  );
  return data;
};

interface Options {
  // Autload issue and comments
  autoload?: boolean;
}

const useIssue = (issueNumber: number, options?: Options) => {
  const { autoload = true } = options || {};

  const queryClient = useQueryClient();

  const issueQuery = useQuery(
    ['issue', issueNumber],
    () => getIssue(issueNumber),
    {
      staleTime: 1000 * 60,
      enabled: autoload,
    }
  );

  const issueCommentsQuery = useQuery(
    ['issue', issueNumber, 'comments'],
    () => getIssueComments(issueNumber),
    // () => getIssueComments( issueQuery.data.value?.number || 0 ),
    {
      staleTime: 1000 * 15,
      enabled: autoload,
      // enabled: computed(() => !!issueQuery.data.value ) // Enabled a true hace que se dispare, con false nunca se dispararía. En este caso, para cargar los comentarios solo cuando el issue se ha cargado.
    }
  );

  const prefetchIssue = (issueNumber: number) => {
    queryClient.prefetchQuery(
      ['issue', issueNumber],
      () => getIssue(issueNumber),
      {
        staleTime: 1000 * 60,
      }
    );

    queryClient.prefetchQuery(
      ['issue', issueNumber, 'comments'],
      () => getIssueComments(issueNumber),
      {
        staleTime: 1000 * 15,
      }
    );
  };

  const setIssueCacheData = (issue: Issue) => {
    // Actualiza el cache de la query del issue, para que si el usuario navega a la página del issue, no tenga que esperar a que se cargue, sino que ya tenga los datos en cache.
    // Basicamente es como si ejecutara el issueQuery de más arriba, porque en realidad obtendría el mismo dato, entonces lo guardamos ahí, y cuando pira el issueQuery, como ya tiene el dato en cache, lo muestra directamente, sin tener que esperar a que se cargue.
    queryClient.setQueryData(['issue', issue.number], issue);
  };

  return {
    issueQuery,
    issueCommentsQuery,

    // Methods
    prefetchIssue,
    setIssueCacheData,
  };
};

export default useIssue;

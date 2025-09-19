import { useMutation } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import ky from 'ky';
import { projectIdAtom } from '../atoms/project';
import useDevice from './useDevice';
import useProject from './useProject';

interface SubmitFeedbackParams {
  description: string;
  email: string;
  files: File[] | null;
  attachProject: boolean;
}

function useSubmitFeedback() {
  const projectId = useAtomValue(projectIdAtom);
  const { device } = useDevice();
  const { data } = useProject(projectId);

  return useMutation({
    mutationFn: async (params: SubmitFeedbackParams) => {
      const formData = new FormData();

      formData.append('description', params.description);
      formData.append('metadata', JSON.stringify(device?.metadata || {}));

      if (params.email) {
        formData.append('email', params.email);
      }

      if (params.files) {
        for (let i = 0; i < params.files.length; i++) {
          formData.append('files', params.files[i]);
        }
      }

      if (params.attachProject && data?.projectFile) {
        formData.append('files', data.projectFile);
      }

      return ky
        .post(`${import.meta.env.VITE_API_URL}/support/submit`, {
          body: formData,
        })
        .json();
    },
  });
}

export default useSubmitFeedback;

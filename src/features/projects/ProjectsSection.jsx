import { useMemo, useState } from 'react';
import { FolderKanban } from 'lucide-react';
import { Container } from '../../components/layout/Container.jsx';
import { SectionHeading } from '../../components/layout/SectionHeading.jsx';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useProjects } from '../../hooks/useProjects.js';
import { ProjectFilters } from './ProjectFilters.jsx';
import { ProjectCard } from './ProjectCard.jsx';
import { EnquiryModal } from '../orders/EnquiryModal.jsx';

export function ProjectsSection() {
  const { projects, status, error, refetch } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Single shared enquiry modal instance for the whole grid — holds
  // which project (if any) is currently being enquired about, rather
  // than each ProjectCard managing its own modal.
  const [enquiryProject, setEnquiryProject] = useState(null);
  const isEnquiryOpen = enquiryProject !== null;

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = !selectedCategory || project.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      const haystack = [project.title, project.description, project.category, project.techs]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [projects, searchTerm, selectedCategory]);

  return (
    <section id="projects" className="scroll-mt-16 border-t border-border py-20">
      <Container>
        <SectionHeading
          eyebrow="Projects"
          title="Selected work"
          description="A mix of client work, freelance builds, and personal projects."
        />

        <div className="mt-8">
          <ProjectFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <div className="mt-8">
          {status === 'loading' && <Loading label="Loading projects…" />}

          {status === 'error' && (
            <ErrorState
              title="Couldn't load projects"
              message={error?.message || 'Something went wrong while fetching projects.'}
              onRetry={refetch}
            />
          )}

          {status === 'success' && projects.length === 0 && (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Projects added in the admin dashboard will appear here." />
          )}

          {status === 'success' && projects.length > 0 && filteredProjects.length === 0 && (
            <EmptyState icon={FolderKanban} title="No matching projects" description="Try a different search term or category." />
          )}

          {status === 'success' && filteredProjects.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onEnquire={setEnquiryProject} />
              ))}
            </div>
          )}
        </div>
      </Container>

      <EnquiryModal
        isOpen={isEnquiryOpen}
        project={enquiryProject}
        onClose={() => setEnquiryProject(null)}
      />
    </section>
  );
}

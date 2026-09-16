import { useOutletContext } from 'react-router-dom';
import { Hero } from '../../components/sections/Hero.jsx';
import { About } from '../../components/sections/About.jsx';
import { Skills } from '../../components/sections/Skills.jsx';
import { Services } from '../../components/sections/Services.jsx';
import { Team } from '../../components/sections/Team.jsx';
import { Testimonials } from '../../components/sections/Testimonials.jsx';
import { Contact } from '../../components/sections/Contact.jsx';
import { ProjectsSection } from '../../features/projects/ProjectsSection.jsx';

export function Home() {
  const { profile } = useOutletContext();

  return (
    <>
      <Hero profile={profile} />
      <About profile={profile} />
      <Skills />
      <Services />
      <ProjectsSection />
      <Team />
      <Testimonials />
      <Contact profile={profile} />
    </>
  );
}

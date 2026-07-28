import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Codex from './pages/Codex';
import Bank from './pages/Bank';
import Search from './pages/Search';
import Entry from './pages/Entry';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/codex" element={<Codex />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/search" element={<Search />} />
        <Route path="/entry/:word" element={<Entry />} />
      </Routes>
    </Layout>
  );
}

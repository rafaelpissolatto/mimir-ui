import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ExplorePage } from './components/explore/ExplorePage';
import { RulesPage } from './components/rules/RulesPage';
import { AlertsPage } from './components/alerts/AlertsPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

// Deprecated: consolidated into /api/data?resource=treks
export default function handler(_req, res) { res.status(410).json({ error: 'Moved to /api/data?resource=treks' }); }

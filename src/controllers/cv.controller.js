const pool = require('../config/db');

async function listCVs(req, res) {
  try {
    const result = await pool.query(
      'select id, name, template, created_at, updated_at from cvs where user_id = $1 order by created_at desc',
      [req.user.id]
    );
    res.json({ cvs: result.rows });
  } catch (err) {
    console.error('listCVs error', err);
    res.status(500).json({ error: 'Could not load CVs' });
  }
}

async function getCV(req, res) {
  try {
    const result = await pool.query('select * from cvs where id = $1 and user_id = $2', [
      req.params.id,
      req.user.id
    ]);
    const cv = result.rows[0];
    if (!cv) return res.status(404).json({ error: 'CV not found' });
    res.json({ cv });
  } catch (err) {
    console.error('getCV error', err);
    res.status(500).json({ error: 'Could not load CV' });
  }
}

async function createCV(req, res) {
  try {
    const { name, template, data } = req.body;
    if (!name || !template || !data) {
      return res.status(400).json({ error: 'name, template and data are required' });
    }
    const result = await pool.query(
      `insert into cvs (user_id, name, template, data)
       values ($1, $2, $3, $4)
       returning id, name, template, created_at, updated_at`,
      [req.user.id, name, template, data]
    );
    res.status(201).json({ cv: result.rows[0] });
  } catch (err) {
    console.error('createCV error', err);
    res.status(500).json({ error: 'Could not save CV' });
  }
}

async function updateCV(req, res) {
  try {
    const { name, template, data } = req.body;
    const result = await pool.query(
      `update cvs set
          name = coalesce($1, name),
          template = coalesce($2, template),
          data = coalesce($3, data),
          updated_at = now()
       where id = $4 and user_id = $5
       returning id, name, template, created_at, updated_at`,
      [name || null, template || null, data || null, req.params.id, req.user.id]
    );
    const cv = result.rows[0];
    if (!cv) return res.status(404).json({ error: 'CV not found' });
    res.json({ cv });
  } catch (err) {
    console.error('updateCV error', err);
    res.status(500).json({ error: 'Could not update CV' });
  }
}

async function deleteCV(req, res) {
  try {
    const result = await pool.query('delete from cvs where id = $1 and user_id = $2 returning id', [
      req.params.id,
      req.user.id
    ]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'CV not found' });
    res.status(204).send();
  } catch (err) {
    console.error('deleteCV error', err);
    res.status(500).json({ error: 'Could not delete CV' });
  }
}

module.exports = { listCVs, getCV, createCV, updateCV, deleteCV };

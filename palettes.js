
import { Router } from 'express';
import axios from 'axios';

const router = Router();

// 🌸Fetch a random monochrome palette from The Color API and return hexes
router.get('/random', async (req, res, next) => {
  try {
    // Get a random base color then derive a monochrome palette
   
    const base = Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
    const resp = await axios.get(`https://www.thecolorapi.com/scheme?hex=${base}&mode=monochrome&count=6`);
    const colors = (resp.data.colors || []).map(c => c.hex.value.replace('#',''));
    res.json({ base, palette: colors });
  } catch (e) {
    next(e);
  }
});

export default router;

import axios from 'axios';

describe('Backend API', () => {
  describe('GET /api/doctors', () => {
    it('should return doctor message', async () => {
      const res = await axios.get(`/api/doctors`);

      expect(res.status).toBe(200);
      expect(res.data).toEqual({ message: 'Hello Doctor' });
    });
  });

  describe('GET /api/patients', () => {
    it('should return patient message', async () => {
      const res = await axios.get(`/api/patients`);

    expect(res.status).toBe(200);
      expect(res.data).toEqual({ message: 'Hello Patient' });
    });
  });
});

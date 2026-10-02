import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface AddressOption {
  value: string;
  label: string;
  postalCode?: string;
}

export function useAddress() {
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [villages, setVillages] = useState<AddressOption[]>([]);

  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');

  useEffect(() => {
    const fetchProvinces = async () => {
      const res = await fetch(`${API_URL}/api/address/provinces`);
      const data = await res.json();
      setProvinces(data);
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (provinceId) {
      // Bersihkan daftar dependen dari pilihan sebelumnya
      setCities([]);
      setDistricts([]);
      setVillages([]);
      const fetchCities = async () => {
        const res = await fetch(`${API_URL}/api/address/cities/${provinceId}`);
        const data = await res.json();
        setCities(data);
      };
      fetchCities();
    }
  }, [provinceId]);

  useEffect(() => {
    if (cityId) {
      setDistricts([]);
      setVillages([]);
      const fetchDistricts = async () => {
        const res = await fetch(`${API_URL}/api/address/districts/${cityId}`);
        const data = await res.json();
        setDistricts(data);
      };
      fetchDistricts();
    }
  }, [cityId]);

  useEffect(() => {
    if (districtId) {
      setVillages([]);
      const fetchVillages = async () => {
        const res = await fetch(`${API_URL}/api/address/villages/${districtId}`);
        const data = await res.json();
        setVillages(data);
      };
      fetchVillages();
    }
  }, [districtId]);

  // Reset seluruh pilihan & daftar dependen (dipakai saat membatalkan
  // perubahan form atau menginisialisasi ulang cascade alamat).
  const reset = () => {
    setProvinceId('');
    setCityId('');
    setDistrictId('');
    setCities([]);
    setDistricts([]);
    setVillages([]);
  };

      return {
    provinces,
    cities,
    districts,
    villages,
    setProvinceId,
    setCityId,
    setDistrictId,
    setProvinces,
    setCities,
    setDistricts,
    setVillages,
    reset,
  };
}
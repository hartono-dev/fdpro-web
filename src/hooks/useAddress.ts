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
      const fetchVillages = async () => {
        const res = await fetch(`${API_URL}/api/address/villages/${districtId}`);
        const data = await res.json();
        setVillages(data);
      };
      fetchVillages();
    }
  }, [districtId]);

  return {
    provinces,
    cities,
    districts,
    villages,
    setProvinceId,
    setCityId,
    setDistrictId,
  };
}
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // تم تعديل هذه الدالة
  const fetchData = async () => {
    // 1. تم تغيير 'id' إلى 'user_id'
    let query = supabase.from('app_data').select('employees, user_id');
    if (search) {
      query = query.ilike('employees', `%${search}%`);
    }
    const { data: appData, error } = await query;
    if (error) console.log('Error fetching data:', error);
    else setData(appData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('app_data').insert({ employees });
    if (error) console.log('Error inserting data:', error);
    else {
      setEmployees('');
      fetchData();
    }
  };

  // تم تعديل هذه الدالة
  const handleUpdate = async (index) => {
    // 2. تم تغيير 'id' إلى 'user_id' هنا أيضاً
    const newEmployees = prompt('Enter new employees data (JSON)', JSON.stringify(data[index].employees));
    if (newEmployees) {
      const { error } = await supabase
        .from('app_data')
        .update({ employees: JSON.parse(newEmployees) })
        .eq('user_id', data[index].user_id); // <-- التغيير هنا
      if (error) console.log('Error updating data:', error);
      else fetchData();
    }
  };

  // تم تعديل هذه الدالة
  const handleDelete = async (userId) => { // تم تغيير اسم المتغير إلى userId للوضوح
    // 3. تم تغيير 'id' إلى 'user_id' هنا
    if (confirm('Are you sure you want to delete this entry?')) {
      const { error } = await supabase.from('app_data').delete().eq('user_id', userId); // <-- التغيير هنا
      if (error) console.log('Error deleting data:', error);
      else fetchData();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Monthly Salaries App</h1>
      <p className="mb-4 text-center">Connected to Supabase!</p>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchData();
          }}
          placeholder="Search employees..."
          className="border p-2 mr-2 w-full md:w-1/2"
        />
      </div>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={employees}
          onChange={(e) => setEmployees(e.target.value)}
          placeholder="Enter employees data (JSON)"
          className="border p-2 mr-2 w-full md:w-1/2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Add Data</button>
      </form>
      <ul className="list-disc pl-5">
        {/* 4. تم تعديل الـ key و استدعاء handleDelete */}
        {data.map((item, index) => (
          <li key={item.user_id} className="mb-2 flex items-center justify-between"> {/* <-- التغيير هنا */}
            {typeof item.employees === 'string' ? item.employees : JSON.stringify(item.employees, null, 2)}
            <button
              onClick={() => handleUpdate(index)}
              className="ml-4 bg-green-500 text-white p-1 rounded"
            >
              Update
            </button>
            <button
              onClick={() => handleDelete(item.user_id)} // <-- التغيير هنا
              className="ml-2 bg-red-500 text-white p-1 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
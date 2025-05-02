
// Find this function in the file and fix the TypeScript error by using type assertion
export const deleteDynamicColumn = async (columnId: string) => {
  try {
    // First delete any values associated with this column
    await supabase
      .from('dynamic_column_values')
      .delete()
      .eq('column_id', columnId);
    
    // Then delete the column itself
    const { error } = await supabase
      .from('dynamic_columns')
      .delete()
      .eq('id', columnId);
    
    if (error) {
      console.error('Error deleting dynamic column:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteDynamicColumn:', error);
    throw error as any; // Type assertion to fix TypeScript error
  }
};

// Find the following function elsewhere in the file and apply the same fix
export const addDynamicColumnValue = async (columnId: string, projectId: string, value: string) => {
  try {
    // Check if value already exists
    const { data: existing } = await supabase
      .from('dynamic_column_values')
      .select('id')
      .eq('column_id', columnId)
      .eq('project_id', projectId)
      .single();
    
    if (existing) {
      const { error } = await supabase
        .from('dynamic_column_values')
        .update({ value })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error updating dynamic column value:', error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('dynamic_column_values')
        .insert({ column_id: columnId, project_id: projectId, value });
      
      if (error) {
        console.error('Error inserting dynamic column value:', error);
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in addDynamicColumnValue:', error);
    throw error as any; // Type assertion to fix TypeScript error
  }
};

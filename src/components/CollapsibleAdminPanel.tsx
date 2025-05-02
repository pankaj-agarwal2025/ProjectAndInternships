
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AdminPanel from './AdminPanel';
import { Faculty } from '@/lib/supabase';
import { Settings } from 'lucide-react';

interface CollapsibleAdminPanelProps {
  currentFaculty: Faculty;
}

const CollapsibleAdminPanel: React.FC<CollapsibleAdminPanelProps> = ({ currentFaculty }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Admin Panel
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Panel</DialogTitle>
          </DialogHeader>
          <AdminPanel currentFaculty={currentFaculty} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollapsibleAdminPanel;

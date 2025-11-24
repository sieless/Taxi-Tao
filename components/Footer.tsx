export default function Footer() {
  return (
    <footer className="bg-green-800 text-green-200 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="border-t border-green-700 pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Taxitao Services. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
